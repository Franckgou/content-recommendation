"""add_unique_constraint_to_user_interactions

Revision ID: 8c7425883a29
Revises: 2e80511c8736
Create Date: 2025-01-20 18:24:11.968173

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8c7425883a29'
down_revision: Union[str, None] = '2e80511c8736'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_unique_constraint('unique_user_movie', 'user_interactions', ['user_id', 'movie_id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('unique_user_movie', 'user_interactions', type_='unique')
    # ### end Alembic commands ###
