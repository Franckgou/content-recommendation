"""clean_duplicates_and_add_unique_constraint

Revision ID: bf231e5ab767
Revises: 8c7425883a29
Create Date: 2025-01-20 18:46:59.450392

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf231e5ab767'
down_revision: Union[str, None] = '8c7425883a29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Delete duplicate records
    op.execute("""
        DELETE FROM user_interactions a
        USING user_interactions b
        WHERE a.id < b.id
        AND a.user_id = b.user_id
        AND a.movie_id = b.movie_id;
    """)
    
    # Step 2: Add unique constraint if it doesn't already exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'unique_user_movie'
            ) THEN
                ALTER TABLE user_interactions
                ADD CONSTRAINT unique_user_movie UNIQUE (user_id, movie_id);
            END IF;
        END
        $$;
    """)


def downgrade() -> None:
    # Step 3: Drop unique constraint
    op.drop_constraint('unique_user_movie', 'user_interactions', type_='unique')
