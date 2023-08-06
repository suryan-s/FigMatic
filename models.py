from sqlalchemy import Column, String, Text, create_engine, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid

Base = declarative_base()
engine = create_engine('sqlite:///figmatic.db')
Base.metadata.create_all(engine)


class User(Base):
    __tablename__ = 'users'

    userid = Column(Text, primary_key=True, default=str(uuid.uuid4()))
    username = Column(String(36), unique=True, nullable=False)
    usernickname = Column(String(36), nullable=False)
    access_token = Column(String(100), nullable=False)
    refresh_token = Column(String(100), nullable=False)


class Repository(Base):
    __tablename__ = 'repositories'

    repo_name = Column(String, primary_key=True)
    project_name = Column(String, nullable=False)

    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    user = relationship('User', backref='repositories')