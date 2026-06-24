import { Link } from 'react-router-dom'
import { Scan, MessageSquare, ShieldCheck, Zap, Activity, Info,Leaf } from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      title: "AI Detection",
      desc: "Instant disease identification from leaf images using EfficientNet.",
      icon: <Scan className="text-emerald-600" size={24} />,
      link: "/detect"
    },
    {
      title: "PlantGuard AI",
      desc: "Chat with our expert AI to get treatment plans and prevention tips.",
      icon: <MessageSquare className="text-emerald-600" size={24} />,
      link: "/chat"
    },
    {
      title: "38 Disease Classes",
      desc: "Trained on a wide variety of plants including Tomato, Potato, and Apple.",
      icon: <Activity className="text-emerald-600" size={24} />,
      link: "/chat"
    }
  ]

  return (
    <div className="max-w-6xl pb-12 mx-auto space-y-12">
      {/* Hero Section */}
      <section className="relative p-8 overflow-hidden text-white shadow-2xl bg-emerald-900 rounded-3xl lg:p-16">
        <div className="relative z-10 max-w-2xl">
          <h2 className="mb-6 text-4xl font-extrabold leading-tight lg:text-6xl">
            Protect Your Crops with <span className="text-emerald-400">AI Intelligence</span>
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-emerald-100">
            The advanced plant disease detection system. Upload a photo of your plant's leaf and get instant diagnosis, organic treatment plans, and expert advice.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/detect" 
              className="px-8 py-4 font-bold text-white transition-all shadow-lg bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-emerald-500/20"
            >
              Start Scanning
            </Link>
            <Link 
              to="/chat" 
              className="px-8 py-4 font-bold text-white transition-all border bg-white/10 hover:bg-white/20 rounded-xl border-white/20 backdrop-blur-sm"
            >
              Ask PlantGuard AI
            </Link>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute rounded-full -right-20 -top-20 w-96 h-96 bg-emerald-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 w-64 h-64 rounded-full right-20 bg-emerald-400/10 blur-2xl"></div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((feature, idx) => (
          <Link 
            key={idx}
            to={feature.link} 
            className="p-8 transition-all bg-white border shadow-sm group rounded-2xl border-slate-200 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="p-3 mb-6 transition-transform bg-emerald-50 rounded-xl w-fit group-hover:scale-110">
              {feature.icon}
            </div>
            <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
            <p className="leading-relaxed text-slate-600">{feature.desc}</p>
          </Link>
        ))}
      </section>

      {/* Info Section */}
      <section className="p-8 bg-white border shadow-sm rounded-2xl border-slate-200">
        <div className="flex flex-col items-center gap-12 lg:flex-row">
          <div className="flex-1 space-y-6">
            <h3 className="text-3xl font-bold text-slate-900">Why use PlantGuard AI?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-1 mt-1 rounded-full bg-emerald-100">
                  <ShieldCheck size={20} className="text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Accurate Diagnosis</h4>
                  <p className="text-slate-600">State-of-the-art EfficientNet model ensures high precision in identifying symptoms.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-1 mt-1 rounded-full bg-emerald-100">
                  <Zap size={20} className="text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Instant Results</h4>
                  <p className="text-slate-600">Get your prediction in seconds, helping you take immediate action to save your crops.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-1 mt-1 rounded-full bg-emerald-100">
                  <Info size={20} className="text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Organic First</h4>
                  <p className="text-slate-600">Our chatbot prioritizes organic and sustainable treatment options for your farm.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-center p-8 border-2 border-dashed aspect-video bg-emerald-50 rounded-2xl border-emerald-200">
              <div className="space-y-4 text-center">
                <Leaf size={48} className="mx-auto text-emerald-300" />
                <p className="italic font-medium text-emerald-600">"Empowering farmers through AI-driven plant healthcare."</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
