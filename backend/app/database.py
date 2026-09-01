from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()


def get_supabase() -> Client:
    """Get Supabase client with anon key (for user-context operations)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def get_supabase_admin() -> Client:
    """Get Supabase client with service_role key (for admin operations)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
