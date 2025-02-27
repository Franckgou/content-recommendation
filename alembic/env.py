from logging.config import fileConfig
from sqlalchemy import create_engine
from alembic import context
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add your project directory to the Python path
sys.path.append(os.getcwd())

# Import your SQLAlchemy models here
from models import Base  # Assuming you have a models.py file

# Alembic Config object
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# Set the target metadata
target_metadata = Base.metadata

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = os.getenv("DATABASE_URL")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    url = os.getenv("DATABASE_URL")
    connectable = create_engine(url)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()