"""Environment-driven configuration for the xKoin fiat bridge service."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="XKOIN_", env_file=".env", extra="ignore")

    # --- Safaricom Daraja ---------------------------------------------------
    daraja_base_url: str = "https://sandbox.safaricom.co.ke"
    daraja_consumer_key: str = ""
    daraja_consumer_secret: str = ""
    daraja_shortcode: str = "174379"  # sandbox Lipa Na M-Pesa shortcode
    daraja_passkey: str = ""
    daraja_b2c_shortcode: str = ""
    daraja_initiator_name: str = ""
    daraja_security_credential: str = ""
    callback_base_url: str = "https://kiosk.example.com"  # public HTTPS root

    # --- Equitel Finserve Jenga --------------------------------------------
    jenga_base_url: str = "https://uat.finserve.africa"
    jenga_api_key: str = ""
    jenga_merchant_code: str = ""
    jenga_consumer_secret: str = ""
    jenga_private_key_path: str = "jenga_private.pem"

    # --- Chain / settlement -------------------------------------------------
    rpc_url: str = "https://sepolia.base.org"
    chain_id: int = 84532  # Base Sepolia
    escrow_address: str = ""
    token_address: str = ""
    bridge_private_key: str = ""  # hot wallet flagged as bridge on xKoinToken
    dry_run: bool = True  # never touch chain or live APIs unless flipped

    # --- Kiosk voucher signing ----------------------------------------------
    kiosk_root_key_hex: str = ""  # Ed25519 seed, 32 bytes hex
    voucher_ttl_seconds: int = 86_400
    ukes_per_kes: int = 1_000_000  # XKN base unit = 1 micro-KES (6 decimals)


@lru_cache
def get_settings() -> Settings:
    return Settings()
