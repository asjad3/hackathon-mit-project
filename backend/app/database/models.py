"""SQLAlchemy database models."""
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base


class Merchant(Base):
    """Merchant entity with rules and configuration."""
    __tablename__ = "merchants"

    merchant_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String, default="")
    address = Column(String, default="")
    lat = Column(Float, default=0.0)
    lng = Column(Float, default=0.0)
    zone_id = Column(String, default="")
    active = Column(Boolean, default=True)

    # Rules
    max_discount_pct = Column(Float, default=20.0)
    goal = Column(String, default="fill_quiet_hours")
    quiet_hours = Column(JSON, default=list)  # List of time ranges
    budget_daily_eur = Column(Float, default=50.0)
    product_categories = Column(JSON, default=list)
    min_order_eur = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    offers = relationship("Offer", back_populates="merchant", cascade="all, delete-orphan")


class Offer(Base):
    """Generated offer entity."""
    __tablename__ = "offers"

    offer_id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchants.merchant_id"), nullable=False)
    merchant_name = Column(String, nullable=False)
    headline = Column(String, nullable=False)
    body = Column(String, nullable=False)
    discount_pct = Column(Float, nullable=False)
    discount_text = Column(String)
    valid_minutes = Column(Integer, nullable=False)
    product_category = Column(String)
    visuals = Column(JSON, default=dict)
    status = Column(String, default="generated")  # generated, viewed, accepted, redeemed, expired, declined
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

    # Relationships
    merchant = relationship("Merchant", back_populates="offers")
    tokens = relationship("Token", back_populates="offer", cascade="all, delete-orphan")


class Token(Base):
    """Redemption token entity."""
    __tablename__ = "tokens"

    token_id = Column(String, primary_key=True)
    offer_id = Column(String, ForeignKey("offers.offer_id"), nullable=False)
    merchant_id = Column(String, ForeignKey("merchants.merchant_id"), nullable=False)
    qr_data = Column(String, default="")
    status = Column(String, default="active")  # active, redeemed, expired, invalid
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    redeemed_at = Column(DateTime)
    discount_pct = Column(Float, default=0.0)
    discount_eur = Column(Float, default=0.0)

    # Relationships
    offer = relationship("Offer", back_populates="tokens")
    records = relationship("RedemptionRecord", back_populates="token", cascade="all, delete-orphan")


class RedemptionRecord(Base):
    """Record of a redeemed offer."""
    __tablename__ = "redemption_records"

    record_id = Column(String, primary_key=True)
    token_id = Column(String, ForeignKey("tokens.token_id"), nullable=False)
    offer_id = Column(String, ForeignKey("offers.offer_id"), nullable=False)
    merchant_id = Column(String, ForeignKey("merchants.merchant_id"), nullable=False)
    discount_applied_eur = Column(Float, nullable=False)
    redeemed_at = Column(DateTime, nullable=False)

    # Relationships
    token = relationship("Token", back_populates="records")
