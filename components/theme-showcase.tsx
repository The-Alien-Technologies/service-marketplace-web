"use client";

import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { brandColors, marketplaceColors, statusColors } from "@/lib/theme";
import { useEffect, useState } from "react";

export function ThemeShowcase() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                S
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Service Marketplace
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Current theme: {theme}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Find & Hire Trusted Service Providers
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with verified professionals for all your service needs. From
            home repairs to digital marketing, we&apos;ve got you covered.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Get Started
            </button>
            <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/80 transition-colors">
              Learn More
            </button>
          </div>
        </section>

        {/* Theme Showcase */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-6">
            Theme Showcase
          </h3>

          {/* Color Palettes */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand Colors */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                Brand Colors
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(brandColors).map(([key, color]) => (
                  <div key={key} className="text-center">
                    <div
                      className="w-12 h-12 rounded-md border border-border mb-2"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-muted-foreground">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketplace Colors */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                Marketplace Colors
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(marketplaceColors).map(([key, color]) => (
                  <div key={key} className="text-center">
                    <div
                      className="w-12 h-12 rounded-md border border-border mb-2"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-muted-foreground">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Colors */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                Status Colors
              </h4>
              <div className="space-y-3">
                {Object.entries(statusColors).map(([key, color]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm capitalize text-card-foreground">
                      {key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Component Examples */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Cards */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">
                Card Components
              </h4>
              <div className="bg-card border border-border rounded-lg p-6">
                <h5 className="text-lg font-semibold text-card-foreground mb-2">
                  Service Provider
                </h5>
                <p className="text-muted-foreground mb-4">
                  Professional web developer with 5+ years experience
                </p>
                <div className="flex gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                    Web Development
                  </span>
                  <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm">
                    React
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">
                Button Variants
              </h4>
              <div className="space-y-3">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                  Primary Button
                </button>
                <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors">
                  Secondary Button
                </button>
                <button className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  Outline Button
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-xl">🔍</span>
            </div>
            <h4 className="text-lg font-semibold text-card-foreground mb-2">
              Find Services
            </h4>
            <p className="text-muted-foreground">
              Browse through thousands of verified service providers
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-xl">⭐</span>
            </div>
            <h4 className="text-lg font-semibold text-card-foreground mb-2">
              Quality Assured
            </h4>
            <p className="text-muted-foreground">
              All providers are vetted and rated by real customers
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-xl">💬</span>
            </div>
            <h4 className="text-lg font-semibold text-card-foreground mb-2">
              Easy Communication
            </h4>
            <p className="text-muted-foreground">
              Built-in messaging and project management tools
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mt-2">
            This is a demonstration of the current theme configuration.
            It&apos;s helpful for visualizing color palettes and component
            styles.
          </p>
        </div>
      </footer>
    </div>
  );
}
