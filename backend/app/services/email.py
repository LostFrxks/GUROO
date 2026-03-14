import smtplib
from email.mime.text import MIMEText

from app.core.config import settings


def send_email(subject: str, body: str, to_email: str) -> None:
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    if settings.smtp_use_ssl:
        server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port)
    else:
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
    with server:
        if settings.smtp_use_tls and not settings.smtp_use_ssl:
            server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, [to_email], msg.as_string())
