from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    app_name: str = "guroo-api"
    app_host: str = "0.0.0.0"
    app_port: int = 8001
    app_debug: bool = True

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    smtp_host: str = Field(validation_alias=AliasChoices("SMTP_HOST", "EMAIL_HOST"))
    smtp_port: int = Field(default=587, validation_alias=AliasChoices("SMTP_PORT", "EMAIL_PORT"))
    smtp_user: str = Field(validation_alias=AliasChoices("SMTP_USER", "EMAIL_HOST_USER"))
    smtp_password: str = Field(validation_alias=AliasChoices("SMTP_PASSWORD", "EMAIL_HOST_PASSWORD"))
    smtp_from: str = Field(validation_alias=AliasChoices("SMTP_FROM", "DEFAULT_FROM_EMAIL", "EMAIL_HOST_USER"))
    smtp_use_tls: bool = Field(default=True, validation_alias=AliasChoices("SMTP_USE_TLS", "EMAIL_USE_TLS"))
    smtp_use_ssl: bool = Field(default=False, validation_alias=AliasChoices("SMTP_USE_SSL", "EMAIL_USE_SSL"))

    media_root: str = "./media"

    report_template_path: str | None = Field(
        default=None,
        validation_alias=AliasChoices("REPORT_TEMPLATE_PATH", "REPORT_TEMPLATE"),
    )

    bot_admin_key: str | None = Field(default=None, validation_alias=AliasChoices("BOT_ADMIN_KEY", "BOT_BACKEND_ADMIN_KEY"))


settings = Settings()
