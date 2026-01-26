'use client';

import { useState } from 'react';
import { 
  Mail, 
  Heart, 
  Coffee, 
  Send, 
  CheckCircle,
  Instagram,
  Twitter,
  Youtube,
  MessageSquare
} from 'lucide-react';

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/chainchapter', color: 'text-pink-500' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/chainchapter', color: 'text-blue-400' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@chainchapter', color: 'text-red-500' },
  { name: 'Email', icon: Mail, href: 'mailto:hello@chainchapter.com', color: 'text-chai-brown' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission - will be replaced with actual API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 sm:mb-16">
          {/* Decorative elements */}
          <div className="flex justify-center gap-4 mb-6">
            <Coffee className="text-chai-brown-light animate-float" size={24} />
            <Heart className="text-terracotta animate-float" size={24} style={{ animationDelay: '0.5s' }} />
            <Coffee className="text-chai-brown-light animate-float" size={24} style={{ animationDelay: '1s' }} />
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4">
            Let's Connect
          </h1>
          <p className="text-terracotta font-body italic text-base sm:text-lg mb-4">
            Over a cup of chai, of course!
          </p>
          <p className="font-body text-lg text-chai-brown-light max-w-2xl mx-auto leading-relaxed">
            Whether you want to chat about books, share your favorite reads, 
            discuss a potential collaboration, or just say hello — I'd love to hear from you!
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-cream-light rounded-2xl p-8 sm:p-12 border border-chai-brown/10">
              <h2 className="font-serif text-2xl sm:text-3xl text-chai-brown mb-4 flex items-center gap-3">
                <MessageSquare size={28} className="text-terracotta" />
                Send Me a Message
              </h2>
              <p className="font-body text-base text-chai-brown-light mb-8">
                Drop me a message and I'll get back to you as soon as possible.
              </p>

              {isSubmitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <p className="text-green-800 font-sans text-sm">
                    Thank you! Your message has been sent. I'll get back to you soon.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-sans font-medium text-chai-brown mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition-all font-body text-chai-brown"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-sans font-medium text-chai-brown mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition-all font-body text-chai-brown"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-sans font-medium text-chai-brown mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition-all font-body text-chai-brown"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-sans font-medium text-chai-brown mb-2">
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition-all font-body text-chai-brown resize-none"
                    placeholder="Tell me what's on your mind..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-terracotta text-cream font-sans font-medium rounded-full hover:bg-terracotta-dark transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - Social Media & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Social Media */}
            <div className="bg-cream-light rounded-2xl p-6 border border-chai-brown/10">
              <h3 className="font-serif text-xl text-chai-brown mb-4">
                Connect on Social Media
              </h3>
              <p className="font-body text-sm text-chai-brown-light mb-6">
                Follow me for daily bookish content, reviews, and reading updates!
              </p>
              <div className="space-y-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-cream border border-chai-brown/20 hover:border-terracotta transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center group-hover:bg-terracotta/20 transition-colors">
                        <Icon size={20} className={`${social.color} group-hover:scale-110 transition-transform`} />
                      </div>
                      <span className="font-sans text-sm text-chai-brown font-medium">{social.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-cream-light rounded-2xl p-6 border border-chai-brown/10">
              <h3 className="font-serif text-xl text-chai-brown mb-4">
                Quick Info
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-sans text-sm font-medium text-chai-brown mb-1">
                    Response Time
                  </p>
                  <p className="font-body text-sm text-chai-brown-light">
                    I typically respond within 24-48 hours
                  </p>
                </div>
                <div>
                  <p className="font-sans text-sm font-medium text-chai-brown mb-1">
                    For Business Inquiries
                  </p>
                  <p className="font-body text-sm text-chai-brown-light">
                    Check out my <a href="/work-with-me" className="text-terracotta hover:underline">Work With Me</a> page for professional services
                  </p>
                </div>
                <div>
                  <p className="font-sans text-sm font-medium text-chai-brown mb-1">
                    Just Want to Chat?
                  </p>
                  <p className="font-body text-sm text-chai-brown-light">
                    I love hearing from fellow readers! Feel free to share book recommendations or just say hello.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
