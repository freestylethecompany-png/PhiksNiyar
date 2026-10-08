'use client';

import React from 'react';
import {
  Snowflake,
  Zap,
  Droplets,
  ThermometerSnowflake,
  Disc,
  Tv,
  Laptop,
  Smartphone,
  Bike,
  Car,
  Hammer,
  Paintbrush,
  Sparkles,
  Camera,
  Wifi,
  ShieldAlert,
  Truck,
  Wrench,
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/constants/categories';
import { ServiceCategory } from '@/lib/db/types';
import { Language, translations } from '@/lib/i18n/translations';

interface CategoryGridProps {
  onSelectCategory: (category: ServiceCategory) => void;
  currentLang?: Language;
}

const iconMap: Record<string, React.ReactNode> = {
  Snowflake: <Snowflake size={24} />,
  Zap: <Zap size={24} />,
  Droplets: <Droplets size={24} />,
  ThermometerSnowflake: <ThermometerSnowflake size={24} />,
  Disc: <Disc size={24} />,
  Tv: <Tv size={24} />,
  Laptop: <Laptop size={24} />,
  Smartphone: <Smartphone size={24} />,
  Bike: <Bike size={24} />,
  Car: <Car size={24} />,
  Hammer: <Hammer size={24} />,
  Paintbrush: <Paintbrush size={24} />,
  Sparkles: <Sparkles size={24} />,
  Camera: <Camera size={24} />,
  Wifi: <Wifi size={24} />,
  ShieldAlert: <ShieldAlert size={24} />,
  Truck: <Truck size={24} />,
};

export default function CategoryGrid({ onSelectCategory, currentLang = 'te' }: CategoryGridProps) {
  const t = translations[currentLang];

  return (
    <section className="category-section">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">{t.popularServicesTitle}</h2>
            <p className="section-subtitle">{t.popularServicesSubtitle}</p>
          </div>
        </div>

        <div className="category-grid">
          {SERVICE_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="category-card"
              onClick={() => onSelectCategory(cat)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCategory(cat);
                }
              }}
              aria-label={`Select ${currentLang === 'te' && cat.teluguName ? cat.teluguName : cat.name}`}
            >
              <div className="category-icon-box">
                {iconMap[cat.icon] || <Wrench size={22} />}
              </div>
              <span className="category-label">
                {currentLang === 'te' && cat.teluguName ? cat.teluguName : cat.name}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginTop: '-2px',
                }}
              >
                {currentLang === 'te' ? `₹${cat.basePriceEstimate} నుండి` : `From ₹${cat.basePriceEstimate}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

