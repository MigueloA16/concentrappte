import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, Users, BarChart, Target, Trophy, Settings, Volume2, Bell, LayoutGrid, Rocket, Play, SkipForward, BookOpen, Briefcase, Code, Microscope, Paintbrush, MessageCircleQuestion } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f1a] text-white">
      <header className="border-b border-gray-800 bg-[#0f0f1a]">
        <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Clock className="h-6 w-6 mr-2 text-purple-400" />
              <span className="text-xl font-bold">ConcentrAPPte</span>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {/* <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Precio
            </Link> */}
            <Link href="#faq" className="text-gray-300 hover:text-white transition-colors">
              Preguntas Frecuentes
            </Link>
          </div>

          {/* Fixed: Changed the flex gap to a more specific flex layout for buttons */}
          <div className="flex items-center">
            <Link href="/auth/sign-in" passHref>
              <Button variant="ghost" className="text-gray-300 hover:text-white text-xs sm:text-sm whitespace-nowrap">
                Inicia Sesión
              </Button>
            </Link>
            <Link href="/auth/sign-up" passHref>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm ml-1 whitespace-nowrap">
                ¡Comienza!
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-10 md:py-18 bg-[#0f0f1a]">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-3">
              {/* <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mb-4 mt-6 text-base bg-violet-500/10 text-violet-400 border-violet-500/20">
                Aumenta tu productividad por menos de lo que valen dos 🍔
              </div> */}
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mb-4 mt-6 text-base bg-violet-500/10 text-violet-400 border-violet-500/20">
                Aumenta tu productividad llevando un mejor control de tu tiempo
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Una forma más inteligente
              </h1>

              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                de hacer más
              </h1>
              <p className="max-w-[700px] text-gray-400 md:text-xl">
                Una APP que te ayuda a lograr más mediante sesiones de estudio colaborativo, competencia amistosa y seguimiento de tu progreso.
              </p>

              {/* Boost Productivity Button */}
              <div className="mt-4">
                <Link href="/auth/sign-in" passHref>
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 rounded-full px-8 py-6 text-base flex items-center gap-2">
                    ¡Aumenta mi productividad!
                    <Rocket className="h-6 w-6" />
                  </Button>
                </Link>
              </div>

              {/* Pricing and Guarantee */}
              <div className="flex flex-col md:flex-row gap-4 items-center mt-6">
                <div className="flex items-center text-green-400 bg-[#131325] rounded-full px-4 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Acceso Ilimitado - Por sólo $9.99</span>
                </div>
                <div className="flex items-center text-purple-400 bg-[#131325] rounded-full px-4 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Garantía de devolución de dinero en los primeros 30 días de uso</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 max-w-5xl mx-auto">
            <Carousel>
              <CarouselContent>
                {/* Focus Timer Slide */}
                <CarouselItem>
                  <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden shadow-2xl p-4">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1/4 md:border-r border-gray-800 p-4">
                        {/* Stats Panel */}
                        <div className="bg-[#131325] rounded-lg p-4 mb-4">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center text-amber-400 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>0 días de racha</span>
                            </div>
                            <div className="flex items-center text-green-400 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>0 sesiones</span>
                            </div>
                            <div className="flex items-center text-blue-400 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>0m concentrado</span>
                            </div>
                          </div>
                        </div>

                        {/* Tasks Panel */}
                        <div className="bg-[#131325] rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Tareas
                            </span>
                          </div>
                          <div className="relative mb-2">
                            <input
                              type="text"
                              placeholder="Añadir una nueva tarea..."
                              className="w-full bg-[#262638] border border-gray-700 rounded-md py-1 px-3 text-sm text-gray-300"
                            />
                          </div>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto">
                            <div className="bg-[#1e1e30] p-2 rounded text-xs text-gray-300">
                              Leer 20 páginas de mi libro hasta las 7pm
                            </div>
                            <div className="bg-[#1e1e30] p-2 rounded text-xs text-gray-300">
                              Revisar las solicitudes de mis usuarios
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-3/4 p-4 flex flex-col items-center justify-center">
                        {/* Timer */}
                        <div className="relative">
                          <div className="w-64 h-64 rounded-full border-4 border-gray-700 flex items-center justify-center">
                            <div className="w-60 h-60 rounded-full border border-green-500/20 flex items-center justify-center relative">
                              {/* Green progress circle - about 15% complete */}
                              <svg className="absolute inset-0" width="240" height="240" viewBox="0 0 240 240">
                                <circle cx="120" cy="120" r="112" fill="none" stroke="#22543d" strokeWidth="4" strokeDasharray="54 704" transform="rotate(-90 120 120)" />
                              </svg>

                              <div className="text-center">
                                <div className="text-5xl font-mono font-bold">25:00</div>
                                <div className="text-xs text-gray-400 mt-2">Sesión de Enfoque</div>
                              </div>
                            </div>
                          </div>

                          {/* Timer controls */}
                          <div className="flex justify-center mt-8 space-x-4">
                            <button className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3">
                              <Play className="h-5 w-5" />
                            </button>
                            <button className="bg-[#1e1e30] text-white rounded-full p-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Audio player */}
                        <div className="mt-8 bg-[#131325] rounded-full px-4 py-2 flex items-center space-x-3 w-64">
                          <span className="text-xs text-gray-400">Firewood</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <div className="flex items-center space-x-2">
                            <button className="text-gray-400">
                              <Play className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400">
                              <SkipForward className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400">
                              <Volume2 className="h-4 w-4" />
                            </button>
                            <div className="w-16 h-1 bg-gray-700 rounded-full">
                              <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>

                {/* Analytics Dashboard Slide */}
                <CarouselItem>
                  <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden shadow-2xl p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-bold text-white">Analytics Dashboard</h3>
                      <p className="text-gray-400">Track your productivity and growth over time</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-[#131325] rounded-lg p-4">
                        <h4 className="text-sm text-gray-400 mb-1">Total Focus Time</h4>
                        <p className="text-2xl font-bold text-white">24h 35m</p>
                        <p className="text-xs text-green-400">+12% from last week</p>
                      </div>
                      <div className="bg-[#131325] rounded-lg p-4">
                        <h4 className="text-sm text-gray-400 mb-1">Longest Streak</h4>
                        <p className="text-2xl font-bold text-white">14 days</p>
                        <p className="text-xs text-green-400">Current: 8 days</p>
                      </div>
                      <div className="bg-[#131325] rounded-lg p-4">
                        <h4 className="text-sm text-gray-400 mb-1">Total Sessions</h4>
                        <p className="text-2xl font-bold text-white">127</p>
                        <p className="text-xs text-green-400">24 this week</p>
                      </div>
                    </div>
                    <div className="bg-[#131325] rounded-lg p-4 h-60 flex items-center justify-center">
                      <div className="w-full h-full relative">
                        {/* Simulated chart */}
                        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-40 px-4">
                          {[35, 45, 28, 65, 72, 55, 48].map((height, i) => (
                            <div key={i} className="w-8 mx-1 bg-gradient-to-t from-purple-600 to-blue-500 rounded-t-sm" style={{ height: `${height}%` }}></div>
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 pt-2 flex justify-between px-4">
                          <span className="text-xs text-gray-500">Mon</span>
                          <span className="text-xs text-gray-500">Tue</span>
                          <span className="text-xs text-gray-500">Wed</span>
                          <span className="text-xs text-gray-500">Thu</span>
                          <span className="text-xs text-gray-500">Fri</span>
                          <span className="text-xs text-gray-500">Sat</span>
                          <span className="text-xs text-gray-500">Sun</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>

                {/* Study Rooms Slide */}
                <CarouselItem>
                  <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden shadow-2xl p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white">Grupos de Estudio</h3>
                      <p className="text-gray-400">Concéntrate en trabajar junto con otros para lograr mejores resultados en tu productividad</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#131325] rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-white">Maratón de Desarollo</h4>
                          <span className="bg-green-900/50 text-green-400 text-xs px-2 py-1 rounded-full">8 online</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Sesión de desarrollo con descansos cada 25 minutos.</p>
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">JD</div>
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">AK</div>
                          <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">MT</div>
                          <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-400">+5</div>
                        </div>
                        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">Ingresar al grupo</Button>
                      </div>

                      <div className="bg-[#131325] rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-white">Grupo de Estudio Alfa</h4>
                          <span className="bg-green-900/50 text-green-400 text-xs px-2 py-1 rounded-full">5 online</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Sala de estudio silenciosa para máxima concentración. Sesiones de 45 minutos.</p>
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">SL</div>
                          <div className="h-8 w-8 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">RK</div>
                          <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold">BM</div>
                          <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-400">+2</div>
                        </div>
                        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">Ingresar al Grupo</Button>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <Button variant="outline" className="border-gray-700 text-gray-300">
                        <Users className="h-4 w-4 mr-2" />
                        Crear Nuevo Grupo
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-4">
                <CarouselPrevious className="static h-8 w-8 translate-x-0 translate-y-0 bg-[#1a1a2e] border-gray-700 text-gray-400 hover:bg-[#262638] hover:text-white" />
                <CarouselNext className="static h-8 w-8 translate-x-0 translate-y-0 bg-[#1a1a2e] border-gray-700 text-gray-400 hover:bg-[#262638] hover:text-white" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* Three Steps section */}
        <section className="py-16 bg-[#131325]">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Tres pasos para enfocarse mejor
              </h2>
              <p className="max-w-[700px] text-gray-400">
                Comienza a mejorar tu productividad en minutos con nuestro sencillo proceso de tres pasos
              </p>
            </div>

            <div className="hidden md:flex justify-between items-center gap-4">
              {/* First card */}
              <div className="flex-1 flex flex-col text-center bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-[#262638] p-4 rounded-full">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Configura tu temporizador</h3>
                <p className="text-gray-400">
                  Elige entre técnicas de concentración científicamente probadas que se adapten a tu estilo de trabajo.
                </p>
              </div>

              {/* First arrow */}
              <div className="flex items-center mt-16 mx-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>

              {/* Second card */}
              <div className="flex-1 flex flex-col text-center bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-[#262638] p-4 rounded-full">
                    <Target className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Mantente Enfocado</h3>
                <p className="text-gray-400">
                  Utiliza nuestro entorno libre de distracciones para mantener una concentración y un enfoque profundos.
                </p>
              </div>

              {/* Second arrow */}
              <div className="flex items-center mt-16 mx-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>

              {/* Third card */}
              <div className="flex-1 flex flex-col text-center bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-[#262638] p-4 rounded-full">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Guarda tu progreso</h3>
                <p className="text-gray-400">
                  Observa cómo crece tu productividad con análisis y logros detallados.
                </p>
              </div>
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-6">
              {/* First card */}
              <div className="bg-[#1a1a2e] rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-[#262638] p-4 rounded-full">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 text-center">Configura tu temporizador</h3>
                <p className="text-gray-400 text-center">
                  Elige entre técnicas de concentración científicamente probadas que se adapten a tu estilo de trabajo.
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 rotate-90">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>

              {/* Second card */}
              <div className="bg-[#1a1a2e] rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-[#262638] p-4 rounded-full">
                    <Target className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 text-center">Mantente enfocado</h3>
                <p className="text-gray-400 text-center">
                  Utiliza nuestro entorno libre de distracciones para mantener una concentración y un enfoque profundos.
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 rotate-90">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>

              {/* Third card */}
              <div className="bg-[#1a1a2e] rounded-lg p-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-[#262638] p-4 rounded-full">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 text-center">Guarda tu progreso</h3>
                <p className="text-gray-400 text-center">
                  Observa cómo crece tu productividad con análisis y logros detallados.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Every Feature You Need section */}
        <section id="features" className="py-16 bg-[#0f0f1a]">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Multiple Funcionalidades
              </h2>
              <p className="max-w-[700px] text-gray-400">
                Herramientas cuidadosamente diseñadas para ayudarte a lograr una concentración profunda y mantener una productividad constante.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <Clock className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Temporizador Científico</h3>
                <p className="text-gray-400">
                  Basado en técnicas de enfoque probadas para un equilibrio óptimo entre trabajo y descanso.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <Trophy className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Tablas de clasificación</h3>
                <p className="text-gray-400">
                  Mantente motivado con tablas de clasificación de enfoque diarias y semanales.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <LayoutGrid className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Tablero Kanban</h3>
                <p className="text-gray-400">
                  Organiza y visualiza tus tareas con una hermosa interfaz de tablero Kanban.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <BarChart className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Análisis Detallado</h3>
                <p className="text-gray-400">
                  Realiza un seguimiento del progreso con gráficas e información valiosa.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <Bell className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Notificaciones inteligentes</h3>
                <p className="text-gray-400">
                  Recordatorios para ayudarte a mantenerte encaminado con las sesiones de enfoque.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <Volume2 className="h-5 w-5 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Ruido Ambiente</h3>
                <p className="text-gray-400">
                  Sonidos ambientales seleccionados para mejorar tu concentración.
                </p>
              </div>

              {/* Feature 7 */}
              <div className="bg-[#1a1a2e] rounded-lg p-8">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <Settings className="h-5 w-5 text-pink-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Configurable</h3>
                <p className="text-gray-400">
                  Ajusta la configuración del temporizador para que coincida con su estilo de trabajo.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Challenge Your Friends Section */}
        <section className="py-16 bg-[#131325]">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <span className="px-3 py-1 text-sm text-purple-400 bg-purple-400/10 rounded-full">Mejor en Compañía</span>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Desafía a tus amigos y sigue el progreso
              </h2>
              <p className="max-w-[800px] text-gray-400">
                Crea grupos de estudio, establece metas colectivas y motívate mutuamente para alcanzar nuevas metas.
                Haz un seguimiento del progreso juntos y celebra los logros en equipo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Challenge Card */}
              <div className="bg-[#0a0a13] border border-gray-800 rounded-xl p-6 shadow-xl">
                <div className="flex justify-center mb-6">
                  <div className="bg-[#1a1a2e] p-4 rounded-full">
                    <Trophy className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-purple-400 text-center mb-4">Desafío de Regreso a Clases</h3>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Meta</div>
                    <div className="font-bold text-white">100 horas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Inicio</div>
                    <div className="font-bold text-white">Feb 3</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Fin</div>
                    <div className="font-bold text-white">Feb 14</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>You</span>
                      <span className="text-purple-400">39.3%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{ width: "39.3%" }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">39 horas 19 min</div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Bro</span>
                      <span className="text-purple-400">39.3%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{ width: "39.3%" }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">3 horas 30 min</div>
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <div className="bg-[#0a0a13] border border-gray-800 rounded-xl p-6 shadow-xl">
                <div className="mb-6">
                  <div className="flex items-center mb-8">
                    <div className="bg-[#1e1e30] p-1 rounded-full mr-2">
                      <Clock className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="font-bold">Hoy</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                      <div className="text-sm text-gray-500">Sesiones</div>
                      <div className="font-bold text-green-400 text-2xl">6</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Duración</div>
                      <div className="font-bold text-blue-400 text-2xl">1h28m</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center mb-8">
                    <div className="bg-[#1e1e30] p-1 rounded-full mr-2">
                      <BarChart className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="font-bold">Progreso Total</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                      <div className="text-sm text-gray-500">Sesiones</div>
                      <div className="font-bold text-white text-2xl">417</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Horas</div>
                      <div className="font-bold text-purple-400 text-2xl">186h6m</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <div className="flex items-center">
                        <div className="bg-[#1e1e30] p-1 rounded-full mr-2">
                          <Target className="h-4 w-4 text-green-400" />
                        </div>
                        <span>Meta de Horas</span>
                      </div>
                      <span>500hr</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-1">
                      <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{ width: "37%" }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>37% completado</span>
                      <span>186h6m / 500hr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Choose Your Focus Style Section */}
        <section className="py-16 bg-[#0f0f1a]">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <span className="px-3 py-1 text-sm text-blue-400 bg-blue-400/10 rounded-full">Enfoque Científico</span>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Elige tu estilo de enfoque
              </h2>
              <p className="max-w-[800px] text-gray-400">
                Múltiples técnicas de gestión del tiempo científicamente probadas que se adaptan a tu estilo de trabajo y preferencias.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Management Techniques Card */}
              <div className="bg-[#0a0a13] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-3 px-4">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-300">Técnicas de Gestión del Tiempo</span>
                  </div>
                </div>

                <div className="p-2">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center p-3 rounded bg-[#1a1a2e] hover:bg-[#262638] transition-colors cursor-pointer">
                      <span className="text-white">Pomodoro clásico</span>
                      <span className="text-gray-400 text-sm">25m trabajo / 5m descanso</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded bg-[#1a1a2e] hover:bg-[#262638] transition-colors cursor-pointer">
                      <span className="text-white">Matriz Eisenhower</span>
                      <span className="text-gray-400 text-sm">50m trabajo / 10m descanso</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded bg-[#1a1a2e] hover:bg-[#262638] transition-colors cursor-pointer">
                      <span className="text-white">Regla 52/17</span>
                      <span className="text-gray-400 text-sm">52m trabajo / 17m descanso</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded bg-[#1a1a2e] hover:bg-[#262638] transition-colors cursor-pointer">
                      <span className="text-white">Ciclo de trabajo de 90 minutos</span>
                      <span className="text-gray-400 text-sm">90m trabajo / 20m descanso</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded bg-[#1a1a2e] hover:bg-[#262638] transition-colors cursor-pointer">
                      <span className="text-white">Timeboxing</span>
                      <span className="text-gray-400 text-sm">60m trabajo / 15m descanso</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded bg-[#1a1a2e] hover:bg-[#262638] transition-colors cursor-pointer">
                      <span className="text-white">Time Blocking</span>
                      <span className="text-gray-400 text-sm">50m trabajo / 10m descanso</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legendary Status Card */}
              <div className="bg-[#0a0a13] border border-gray-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center mb-8">
                  <div className="bg-[#1a1a2e] p-3 rounded-full mr-3">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400">Legendario</h3>
                    <p className="text-gray-400">320 horas registradas</p>
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Progreso a Legendario</span>
                    <span className="text-yellow-400">98.2%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full" style={{ width: "98.2%" }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#1a1a2e] rounded-lg p-4">
                    <div className="flex items-center mb-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4 mr-2 text-yellow-400" />
                      <span>Racha Actual</span>
                    </div>
                    <div className="text-2xl font-bold">22 días</div>
                  </div>

                  <div className="bg-[#1a1a2e] rounded-lg p-4">
                    <div className="flex items-center mb-2 text-sm text-gray-400">
                      <Trophy className="h-4 w-4 mr-2 text-yellow-400" />
                      <span>Mejor Racha</span>
                    </div>
                    <div className="text-2xl font-bold">22 días</div>
                  </div>
                </div>

                <div className="text-center italic text-gray-500 text-sm mt-8">
                  "Recuerda siempre por qué empezaste"
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Watch Your Progress Grow Section */}
        <section className="py-16 bg-[#131325]">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <span className="px-3 py-1 text-sm text-green-400 bg-green-400/10 rounded-full">Progreso Visual</span>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Observa cómo crece tu progreso
              </h2>
              <p className="max-w-[800px] text-gray-400">
                Mantén la motivación con un atractivo seguimiento visual.
                Observa cómo tus hábitos de concentración se desarrollan con el tiempo con nuestro mapa de calor de actividad estilo GitHub.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="bg-[#0a0a13] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-blue-400 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <span className="font-medium text-white">Historial</span>
                    </div>
                  </div>

                  {/* GitHub-style heatmap */}
                  <div className="py-4">
                    <div className="grid grid-cols-52 gap-[2px]">
                      {Array.from({ length: 364 }).map((_, index) => {
                        // Generate random intensity (for demo purposes)
                        const intensity = Math.floor(Math.random() * 5);
                        let bgColor = 'bg-[#101018]';

                        if (intensity === 1) bgColor = 'bg-green-900/30';
                        if (intensity === 2) bgColor = 'bg-green-800/50';
                        if (intensity === 3) bgColor = 'bg-green-700/70';
                        if (intensity === 4) bgColor = 'bg-green-600';

                        return (
                          <div
                            key={index}
                            className={`${bgColor} w-3 h-3 rounded-sm`}
                            title={`${intensity} hours on day ${index + 1}`}
                          />
                        );
                      })}
                    </div>

                    <div className="flex justify-end items-center mt-2 space-x-1 text-xs text-gray-500">
                      <span>Menos</span>
                      <div className="bg-[#101018] w-2 h-2 rounded-sm"></div>
                      <div className="bg-green-900/30 w-2 h-2 rounded-sm"></div>
                      <div className="bg-green-800/50 w-2 h-2 rounded-sm"></div>
                      <div className="bg-green-700/70 w-2 h-2 rounded-sm"></div>
                      <div className="bg-green-600 w-2 h-2 rounded-sm"></div>
                      <span>Más</span>
                    </div>
                  </div>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-t border-gray-800">
                  <div className="p-6 border-r border-gray-800">
                    <div className="flex items-start mb-2">
                      <div className="bg-[#1a1a2e] p-1 rounded mr-2 mt-1">
                        <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                      <h3 className="text-white text-lg font-medium">Daily Tracking</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Observa cómo tus bloques de enfoque se acumulan día a día con nuestra hermosa visualización de mapa de calor.
                    </p>
                  </div>

                  <div className="p-6 md:border-r border-gray-800">
                    <div className="flex items-start mb-2">
                      <div className="bg-[#1a1a2e] p-1 rounded mr-2 mt-1">
                        <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M7 3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M17 3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M3 5C3 4.44772 3.44772 4 4 4H20C20.5523 4 21 4.44772 21 5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V5Z" stroke="currentColor" strokeWidth="2" />
                          <path d="M8 15L10 17L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <h3 className="text-white text-lg font-medium">Detalles de tu progreso</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Obtén estadísticas detalladas sobre tus sesiones de enfoque, rachas y mejoras.
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start mb-2">
                      <div className="bg-[#1a1a2e] p-1 rounded mr-2 mt-1">
                        <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 22V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M20 18L13.0722 7.28661C12.4062 6.29588 10.9978 6.31414 10.3588 7.32179L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M16 18H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <h3 className="text-white text-lg font-medium">Sistema de Logros</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Obtén logros y observa cómo tu progreso aumenta a medida que desarrollas mejores hábitos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* One Simple Price Section */}
        {/* <section id="pricing" className="py-16 bg-[#0f0f1a]">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-2 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Único Precio
              </h2>
              <p className="max-w-[700px] text-gray-400">
                Desbloquea todas las funcionalidades con un único pago.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-[#0a0a13] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-6 text-center">
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-full">
                      Oferta por Tiempo Limitado - 50% Descuento
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4">Acceso de por vida</h3>

                  <div className="flex justify-center items-center mb-2">
                    <span className="text-gray-400 line-through mr-2 text-xl">$19.99</span>
                    <span className="text-4xl md:text-5xl font-bold text-white">$9.99</span>
                  </div>

                  <p className="text-gray-400 text-sm mb-6">Único Pago, acceso vitalicio</p>

                  <div className="bg-[#1a1a2e] p-4 rounded-lg mb-6 text-left">
                    <h4 className="text-white text-base mb-2">¿Por qué es una ganga?:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-gray-300">
                        <span className="flex-shrink-0 h-5 w-5 mr-2 text-purple-400">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </span>
                        Menos que 2 🍔 hamburguesas
                      </li>
                      <li className="flex items-center text-sm text-gray-300">
                        <span className="flex-shrink-0 h-5 w-5 mr-2 text-purple-400">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H20C21.1046 18 22 17.1046 22 16V8C22 6.89543 21.1046 6 20 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        $0.027/día por año
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3 text-left mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 mt-1 mr-2 text-purple-400">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Todas las funcionalidades</span>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 mt-1 mr-2 text-purple-400">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Dashboard de Análisis Detallado</span>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 mt-1 mr-2 text-purple-400">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Tabla de Clasificaciones</span>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 mt-1 mr-2 text-purple-400">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Sonidos Ambiente Premium</span>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 mt-1 mr-2 text-purple-400">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Soporte Prioritario</span>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 mt-1 mr-2 text-purple-400">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Actualizaciones Futuras</span>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 mt-1 mr-2 text-purple-400">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Devolución de dinero en los primeros 30 días</span>
                    </div>
                  </div>

                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-sm py-3">
                    ¡Comienza Ahora!
                  </Button>

                  <p className="text-gray-500 text-sm mt-4">
                    Únete a más de 1+ usuarios productivos hoy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section> */}

        {/* Who Uses Our Focus Timer section */}
        <section id="users" className="py-16 bg-black">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-white">
                ¿Quiénes pueden usar nuestra APP?
              </h2>
              <p className="max-w-[700px] text-gray-400">
                Únete a miles de personas enfocadas en el éxito que utilizan nuestra herramienta para aumentar su productividad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Students */}
              <div className="bg-[#1a1a2e] rounded-lg p-8 border border-gray-800">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-white">Estudiantes</h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-blue-900/30 text-blue-400 rounded mt-1">
                      Popular
                    </span>
                  </div>
                </div>
                <p className="text-gray-400">
                  Realiza un seguimiento de tus sesiones de estudio, manten la concentración durante la preparación para los exámenes y compite con tus compañeros de clase para mantenerte motivado.
                </p>
              </div>

              {/* Developers */}
              <div className="bg-[#1a1a2e] rounded-lg p-8 border border-gray-800">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <Code className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-white">Desarrolladores</h3>
                  </div>
                </div>
                <p className="text-gray-400">
                  Manten una concentración profunda durante las sesiones de programación, evita el agotamiento con descansos cronometrados y realiza un seguimiento de tus horas más productivas.
                </p>
              </div>

              {/* Creators */}
              <div className="bg-[#1a1a2e] rounded-lg p-8 border border-gray-800">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <Paintbrush className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-white">Artistas</h3>
                  </div>
                </div>
                <p className="text-gray-400">
                  Equilibra los tiempos de creación y los descansos, manten un rendimiento constante y desarrolla mejores hábitos de trabajo.
                </p>
              </div>

              {/* Professionals */}
              <div className="bg-[#1a1a2e] rounded-lg p-8 border border-gray-800">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <Briefcase className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-white">Profesionales</h3>
                  </div>
                </div>
                <p className="text-gray-400">
                  Organiza tu jornada laboral en bloques específicos, reduce las distracciones y mejora la productividad. Manten un rendimiento constante y desarrolla mejores hábitos de trabajo.
                </p>
              </div>

              {/* Researchers */}
              <div className="bg-[#1a1a2e] rounded-lg p-8 border border-gray-800">
                <div className="flex items-start mb-5">
                  <div className="bg-[#262638] p-3 rounded-full">
                    <Microscope className="h-5 w-5 text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-white">Investigadores</h3>
                  </div>
                </div>
                <p className="text-gray-400">
                  Manténte concentrado durante una investigación prolongada, conserva la claridad mental con descansos cronometrados y realiza un seguimiento de los patrones de estudio.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-black">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-white">
                Preguntas Frecuentes
              </h2>
              <p className="max-w-[700px] text-gray-400">
                Todo lo que debes saber acerca de ConcentrAPPte
              </p>
            </div>

            <div className="space-y-6">
              {/* Question 1 */}
              <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-[#262638] flex items-center justify-center">
                    <MessageCircleQuestion className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white">¿En qué se diferencia ConcentrAPPte de otras aplicaciones de productividad?</h3>
                    <p className="text-gray-400">
                      A diferencia de las apps de temporizador básicas, ConcentrAPPte es un ecosistema completo de productividad utilizado por más de 1 usuario. Nuestra combinación única de seguimiento de enfoque, retos grupales y logros ayuda a los usuarios a duplicar su tiempo de estudio en 30 días.*
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 2 */}
              {/* <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-[#262638] flex items-center justify-center">
                    <MessageCircleQuestion className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white">¿Realmente vale la pena el pago único?</h3>
                    <p className="text-gray-400">
                      Por menos de dos hamburgesas ($9.99), obtienes acceso de por vida a una herramienta que ha ayudado a estudiantes a mejorar sus calificaciones. Además, ofrecemos una garantía de devolución de dinero de 30 días.
                    </p>
                  </div>
                </div>
              </div> */}

              {/* Question 3 */}
              <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-[#262638] flex items-center justify-center">
                    <MessageCircleQuestion className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white">Procrastino mucho. ¿Me ayudará esto?</h3>
                    <p className="text-gray-400">
                      Nuestro sistema gamificado convierte la procrastinación en motivación con recompensas instantáneas y responsabilidad grupal. La mayoría de los usuarios pasan de estudiar 2 horas semanales a más de 15 horas sintiéndose menos estresados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 4 */}
              <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-[#262638] flex items-center justify-center">
                    <MessageCircleQuestion className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white">¿Qué tan rápido puedo esperar ver resultados?</h3>
                    <p className="text-gray-400">
                      El 89% de los usuarios duplica su tiempo de estudio concentrado en tan solo 14 días. El sistema de seguimiento visual del progreso y los logros genera retroalimentación positiva inmediata que te motiva a seguir adelante.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question 5 */}
              <div className="bg-[#1a1a2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-6 w-6 mt-1 rounded-full bg-[#262638] flex items-center justify-center">
                    <MessageCircleQuestion className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white">¿Puedo utilizar ConcentrAPPte con mi grupo de estudio?</h3>
                    <p className="text-gray-400">
                      Crea grupos de estudio ilimitados y motívate mutuamente con retos personalizados y seguimiento del progreso en tiempo real. Los grupos que usan ConcentrAPPte juntos muestran una constancia tres veces mayor que los usuarios individuales.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 bg-[#0f0f1a]">
        <div className="container px-4 py-8 md:py-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Clock className="h-5 w-5 mr-2 text-purple-400" />
              <span className="font-bold">ConcentrAPPte</span>
            </div>
            <div className="flex space-x-4 text-sm text-gray-400">
              <Link href="#" className="hover:text-purple-400">
                Privacy
              </Link>
              <Link href="#" className="hover:text-purple-400">
                Terms
              </Link>
              <Link href="#" className="hover:text-purple-400">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} ConcentrAPPte. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}