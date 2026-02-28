import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-light">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Navigate Your <span className="text-primary">Career Path</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              CareerCompass uses AI to analyze your CV and identify skill gaps for your dream jobs. Get personalized insights and recommendations.
            </p>
            <div className="flex gap-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-secondary transition"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    to="/jobs"
                    className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-semibold hover:bg-accent transition"
                  >
                    Browse Jobs
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-secondary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary transition"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-semibold hover:bg-accent transition"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-full h-80 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-90"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
          Powerful Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Job Analysis',
              description: 'Access thousands of real job listings and analyze skill requirements.',
            },
            {
              title: 'AI-Powered Insights',
              description: 'Get instant skill gap analysis using advanced NLP technology.',
            },
            {
              title: 'Career Growth',
              description: 'Receive personalized recommendations to advance your career.',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-none p-8 hover:shadow-[0_25px_50px_rgba(0,0,0,0.35)] transition-shadow duration-200 border-t-4 border-primary"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: 1, title: 'Create Account', desc: 'Sign up in seconds' },
            { step: 2, title: 'Upload CV', desc: 'Share your resume' },
            { step: 3, title: 'Browse Jobs', desc: 'Explore opportunities' },
            { step: 4, title: 'Get Insights', desc: 'Analyze skill gaps' },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-300">
            © 2026 CareerCompass. Your AI-powered career companion.
          </p>
        </div>
      </footer>
    </div>
  );
}
