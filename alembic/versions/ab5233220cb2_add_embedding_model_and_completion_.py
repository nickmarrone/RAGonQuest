"""Add embedding_model and completion_model to corpus

Revision ID: ab5233220cb2
Revises: 5f672fc43120
Create Date: 2025-07-02 12:39:45.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab5233220cb2'
down_revision: Union[str, Sequence[str], None] = '5f672fc43120'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add embedding_model and completion_model columns to corpora table
    op.add_column('corpora', sa.Column('embedding_model', sa.String(length=100), nullable=False, server_default='text-embedding-3-small'))
    op.add_column('corpora', sa.Column('completion_model', sa.String(length=100), nullable=False, server_default='gpt-4o-mini'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove the added columns
    op.drop_column('corpora', 'completion_model')
    op.drop_column('corpora', 'embedding_model')
