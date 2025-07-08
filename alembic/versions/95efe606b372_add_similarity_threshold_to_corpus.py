"""add_similarity_threshold_to_corpus

Revision ID: 95efe606b372
Revises: f9fb3e81ba80
Create Date: 2025-07-08 12:20:45.669593

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '95efe606b372'
down_revision: Union[str, Sequence[str], None] = 'f9fb3e81ba80'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add similarity_threshold column to corpora table with default value 0.7
    op.add_column('corpora', sa.Column('similarity_threshold', sa.Float(), nullable=False, server_default='0.7'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove similarity_threshold column from corpora table
    op.drop_column('corpora', 'similarity_threshold')
