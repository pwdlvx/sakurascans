"use client";

import Link from 'next/link';
import { Users, PenTool, Brush, Languages, Globe, Star, CheckCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { Header } from '@/components/header';
import { AuthModal } from '@/components/auth-modal';
import { Footer } from '@/components/footer';

export default function RecruitmentPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    discord: '',
    role: '',
    experience: '',
    portfolio: '',
    motivation: ''
  });

  const roles = [
    {
      id: 'translator',
      title: 'Translator',
      icon: Languages,
      description: 'Translate Korean/Japanese to English',
      requirements: ['Native or fluent English', 'Korean/Japanese proficiency', 'Previous translation experience preferred'],
      commitment: '2-3 chapters per week'
    },
    {
      id: 'typesetter',
      title: 'Typesetter',
      icon: PenTool,
      description: 'Clean and typeset manga pages',
      requirements: ['Photoshop experience', 'Attention to detail', 'Font knowledge'],
      commitment: '3-5 chapters per week'
    },
    {
      id: 'cleaner',
      title: 'Cleaner/Redrawer',
      icon: Brush,
      description: 'Clean raw images and redraw artwork',
      requirements: ['Photoshop/digital art skills', 'Understanding of manga art style', 'Patience for detail work'],
      commitment: '2-4 chapters per week'
    },
    {
      id: 'proofreader',
      title: 'Proofreader',
      icon: CheckCircle,
      description: 'Review and edit translated content',
      requirements: ['Excellent English grammar', 'Manga reading experience', 'Critical eye for errors'],
      commitment: '4-6 chapters per week'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Application submitted:', formData);
    alert('Application submitted! We will review your application and get back to you soon.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={() => setShowAuthModal(true)} />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sakura-primary/20 via-sakura-accent/10 to-transparent"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="w-16 h-16 bg-sakura-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="text-white" size={32} />
            </div>
            <h1 className="title-font text-3xl md:text-4xl mb-4">Join the Sakura Scans Team</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Help bring amazing manga and manhwa to English readers worldwide. We're looking for passionate individuals to join our scanlation team.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-sakura-primary">
                <Star size={16} />
                <span>Quality focused</span>
              </div>
              <div className="flex items-center gap-2 text-sakura-primary">
                <Globe size={16} />
                <span>International team</span>
              </div>
              <div className="flex items-center gap-2 text-sakura-primary">
                <CheckCircle size={16} />
                <span>Regular releases</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Roles */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="title-font text-2xl md:text-3xl mb-12 text-center">Available Positions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.id} className="asura-card p-6 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sakura-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{role.title}</h3>
                      <p className="text-muted-foreground mb-4">{role.description}</p>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Requirements:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {role.requirements.map((req, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-sakura-primary rounded-full"></div>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">Time commitment: </span>
                        <span className="text-sakura-primary">{role.commitment}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="title-font text-2xl md:text-3xl mb-4">Apply Now</h2>
              <p className="text-muted-foreground">
                Fill out the form below and we'll get back to you within 48 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="asura-card p-8 rounded-lg space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discord Username *</label>
                <input
                  type="text"
                  name="discord"
                  value={formData.discord}
                  onChange={handleInputChange}
                  placeholder="username#1234"
                  className="w-full px-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Position Applying For *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary"
                  required
                >
                  <option value="">Select a position...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Relevant Experience</label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell us about your relevant experience..."
                  className="w-full px-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Portfolio/Work Samples</label>
                <input
                  type="url"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleInputChange}
                  placeholder="https://your-portfolio.com"
                  className="w-full px-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Why do you want to join? *</label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell us what motivates you to join our team..."
                  className="w-full px-4 py-3 bg-secondary border border-sakura-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sakura-primary resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full sakura-button text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Submit Application
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
