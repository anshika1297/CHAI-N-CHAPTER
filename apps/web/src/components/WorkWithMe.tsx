'use client';

import { useState } from 'react';
import { 
  BookOpen, 
  PenTool, 
  FileText, 
  MessageSquare, 
  Briefcase, 
  DollarSign,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Send,
  CheckCircle
} from 'lucide-react';

const services = [
  {
    id: 'beta-reading',
    title: 'Beta Reading',
    icon: BookOpen,
    description: 'Get detailed feedback on your manuscript before publication. I provide comprehensive analysis on plot, character development, pacing, and overall story structure.',
  },
  {
    id: 'book-reviews',
    title: 'Book Reviews',
    icon: PenTool,
    description: 'Honest and detailed book reviews for your published works. Reviews will be featured on the blog and shared across social media platforms.',
  },
  {
    id: 'proofreading',
    title: 'Proofreading',
    icon: FileText,
    description: 'Thorough proofreading services to catch grammar, spelling, punctuation, and formatting errors. Ensure your manuscript is polished and professional.',
  },
  {
    id: 'author-interviews',
    title: 'Author Interviews',
    icon: MessageSquare,
    description: 'Engaging author interviews to help promote your book and share your writing journey with my reading community.',
  },
  {
    id: 'literary-agent',
    title: 'Literary Agent Services',
    icon: Briefcase,
    description: 'Assistance with manuscript submissions, query letter reviews, and guidance on navigating the publishing industry.',
  },
  {
    id: 'paid-content',
    title: 'Paid Content & Collaborations',
    icon: DollarSign,
    description: 'Sponsored blog posts, social media promotions, book tours, and other collaborative content opportunities for authors and publishers.',
  },
];

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/chainchapter', color: 'text-pink-500' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/chainchapter', color: 'text-blue-400' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@chainchapter', color: 'text-red-500' },
  { name: 'Email', icon: Mail, href: 'mailto:hello@chainchapter.com', color: 'text-chai-brown' },
];

export default function WorkWithMe() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      setFormData({ name: '', email: '', service: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 sm:mb-16">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4">
            Work With Me
          </h1>
          <p className="font-body text-lg text-chai-brown-light max-w-2xl mx-auto leading-relaxed">
            I'm passionate about supporting authors and publishers in their literary journey. 
            Whether you need a beta reader, book reviewer, or a collaborator for your next project, 
            I'd love to help bring your stories to life.
          </p>
        </header>

        {/* Services Section */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl sm:text-3xl text-chai-brown mb-8 text-center">
            Services I Offer
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-cream-light rounded-xl p-6 border border-chai-brown/10 hover:border-terracotta transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center">
                      <Icon size={24} className="text-terracotta" />
                    </div>
                    <h3 className="font-serif text-xl text-chai-brown">{service.title}</h3>
                  </div>
                  <p className="font-body text-sm text-chai-brown-light leading-relaxed">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Social Media Section */}
        <section className="mb-16">
          <div className="bg-cream-light rounded-2xl p-8 sm:p-12 border border-chai-brown/10">
            <h2 className="font-serif text-2xl sm:text-3xl text-chai-brown mb-6 text-center">
              Connect With Me
            </h2>
            <p className="font-body text-base text-chai-brown-light text-center mb-8 max-w-2xl mx-auto">
              Follow me on social media to stay updated with my latest reviews, recommendations, and bookish content.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cream border border-chai-brown/20 hover:border-terracotta transition-all duration-300 hover:shadow-md group"
                  >
                    <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center group-hover:bg-terracotta/20 transition-colors">
                      <Icon size={24} className={`${social.color} group-hover:scale-110 transition-transform`} />
                    </div>
                    <span className="font-sans text-sm text-chai-brown font-medium">{social.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="mb-12">
          <div className="bg-cream-light rounded-2xl p-8 sm:p-12 border border-chai-brown/10 max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl text-chai-brown mb-4 text-center">
              Let's Work Together
            </h2>
            <p className="font-body text-base text-chai-brown-light text-center mb-8">
              Have a project in mind? Fill out the form below and I'll get back to you as soon as possible.
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
                  placeholder="John Doe"
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
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="service" className="block text-sm font-sans font-medium text-chai-brown mb-2">
                  Service Interested In *
                </label>
                <select
                  id="service"
                  name="service"
                  required
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition-all font-body text-chai-brown"
                >
                  <option value="">Select a service...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                  <option value="other">Other / General Inquiry</option>
                </select>
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
                  placeholder="Tell me about your project, timeline, and any specific requirements..."
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
        </section>
      </div>
    </section>
  );
}
