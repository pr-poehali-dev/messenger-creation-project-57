"""
Система аутентификации Pulse: регистрация, вход, выход, профиль.
POST /register, POST /login, POST /logout, GET /me, PUT /me
"""
import json
import os
import hashlib
import secrets

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}

AVATAR_COLORS = ["#a855f7", "#22d3ee", "#f472b6", "#34d399", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6"]

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def tbl(name: str) -> str:
    return f"{SCHEMA}.{name}"


def get_db():
    import psycopg2
    from psycopg2.extras import RealDictCursor
    return psycopg2.connect(os.environ["DATABASE_URL"], cursor_factory=RealDictCursor)


def hash_password(password: str) -> str:
    salt = os.environ.get("MAIN_DB_SCHEMA", "pulse_salt")
    return hashlib.sha256((password + salt).encode()).hexdigest()


def ok(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def err(message: str, status: int = 400) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": message}, ensure_ascii=False),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    body = {}
    raw_body = event.get("body") or ""
    if raw_body:
        body = json.loads(raw_body)

    headers_dict = event.get("headers") or {}
    token = headers_dict.get("X-Session-Token") or headers_dict.get("x-session-token") or ""

    print("AUTH:", method, path)

    # POST /register
    if "/register" in path and method == "POST":
        username = (body.get("username") or "").strip().lower()
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        display_name = (body.get("display_name") or username).strip()

        if not username or not email or not password:
            return err("Заполните все поля")
        if len(password) < 6:
            return err("Пароль должен быть не менее 6 символов")
        if len(username) < 3:
            return err("Имя пользователя — минимум 3 символа")
        if "@" not in email:
            return err("Некорректный email")

        avatar_letter = (display_name or username)[0].upper()
        avatar_color = AVATAR_COLORS[len(username) % len(AVATAR_COLORS)]
        pw_hash = hash_password(password)

        conn = get_db()
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id FROM {tbl('users')} WHERE username = %s OR email = %s",
                (username, email),
            )
            if cur.fetchone():
                conn.close()
                return err("Пользователь с таким именем или email уже существует")

            cur.execute(
                f"INSERT INTO {tbl('users')} (username, email, password_hash, display_name, avatar_letter, avatar_color) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (username, email, pw_hash, display_name, avatar_letter, avatar_color),
            )
            user_id = cur.fetchone()["id"]
            session_token = secrets.token_urlsafe(32)
            cur.execute(
                f"INSERT INTO {tbl('sessions')} (token, user_id) VALUES (%s, %s)",
                (session_token, user_id),
            )
        conn.commit()
        conn.close()
        print("Registered:", username, "id:", user_id)
        return ok({
            "token": session_token,
            "user": {
                "id": user_id,
                "username": username,
                "display_name": display_name,
                "avatar_letter": avatar_letter,
                "avatar_color": avatar_color,
                "status_text": "Привет, я использую Pulse!",
                "email": email,
                "is_online": False,
            },
        }, 201)

    # POST /login
    if "/login" in path and method == "POST":
        login = (body.get("login") or body.get("email") or body.get("username") or "").strip().lower()
        password = body.get("password") or ""

        if not login or not password:
            return err("Введите логин и пароль")

        pw_hash = hash_password(password)
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT * FROM {tbl('users')} WHERE (email = %s OR username = %s) AND password_hash = %s",
                (login, login, pw_hash),
            )
            user = cur.fetchone()
            if not user:
                conn.close()
                return err("Неверный логин или пароль", 401)

            session_token = secrets.token_urlsafe(32)
            cur.execute(f"INSERT INTO {tbl('sessions')} (token, user_id) VALUES (%s, %s)", (session_token, user["id"]))
            cur.execute(f"UPDATE {tbl('users')} SET is_online = TRUE, updated_at = NOW() WHERE id = %s", (user["id"],))
        conn.commit()
        conn.close()
        print("Login:", user["username"])
        return ok({
            "token": session_token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "display_name": user["display_name"],
                "avatar_letter": user["avatar_letter"],
                "avatar_color": user["avatar_color"],
                "status_text": user["status_text"],
                "email": user["email"],
                "is_online": True,
            },
        })

    # POST /logout
    if "/logout" in path and method == "POST":
        if token:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute(f"SELECT user_id FROM {tbl('sessions')} WHERE token = %s", (token,))
                row = cur.fetchone()
                if row:
                    cur.execute(f"UPDATE {tbl('users')} SET is_online = FALSE WHERE id = %s", (row["user_id"],))
                cur.execute(f"UPDATE {tbl('sessions')} SET expires_at = NOW() WHERE token = %s", (token,))
            conn.commit()
            conn.close()
        return ok({"success": True})

    # GET /me
    if "/me" in path and method == "GET":
        if not token:
            return err("Не авторизован", 401)
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT u.* FROM {tbl('users')} u JOIN {tbl('sessions')} s ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
                (token,),
            )
            user = cur.fetchone()
        conn.close()
        if not user:
            return err("Сессия истекла", 401)
        return ok({
            "id": user["id"],
            "username": user["username"],
            "display_name": user["display_name"],
            "avatar_letter": user["avatar_letter"],
            "avatar_color": user["avatar_color"],
            "status_text": user["status_text"],
            "email": user["email"],
            "is_online": user["is_online"],
        })

    # PUT /me
    if "/me" in path and method == "PUT":
        if not token:
            return err("Не авторизован", 401)
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT u.* FROM {tbl('users')} u JOIN {tbl('sessions')} s ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
                (token,),
            )
            user = cur.fetchone()
            if not user:
                conn.close()
                return err("Сессия истекла", 401)

            display_name = (body.get("display_name") or "").strip() or user["display_name"]
            status_text = body.get("status_text") if body.get("status_text") is not None else user["status_text"]
            cur.execute(
                f"UPDATE {tbl('users')} SET display_name = %s, status_text = %s, updated_at = NOW() WHERE id = %s",
                (display_name, status_text, user["id"]),
            )
        conn.commit()
        conn.close()
        return ok({"success": True, "display_name": display_name, "status_text": status_text})

    return err("Маршрут не найден", 404)
