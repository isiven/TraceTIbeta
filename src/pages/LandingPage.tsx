import { Link } from 'react-router-dom';
import { Radar, Shield, TrendingUp, Users, Bell, BarChart3, Check, Package, HardDrive, FileText, CheckCircle, Calendar } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Radar className="w-10 h-10 text-primary" />
              <span className="ml-2 text-2xl font-bold text-darkGray">TraceTI</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#product" className="text-mediumGray hover:text-darkGray font-medium">
                Producto
              </a>
              <a href="#features" className="text-mediumGray hover:text-darkGray font-medium">
                Funcionalidades
              </a>
              <a href="#pricing" className="text-mediumGray hover:text-darkGray font-medium">
                Precios
              </a>
              <a href="#contact" className="text-mediumGray hover:text-darkGray font-medium">
                Contacto
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-primary hover:text-primary-dark font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-primary text-white px-6 py-2.5 rounded font-semibold hover:bg-primary-dark transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-gray-50 via-white to-gray-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-darkGray">Mantén el control.</span>
                <br />
                <span className="text-primary">Asegura tu futuro.</span>
              </h1>
              <p className="text-xl text-mediumGray mb-8 leading-relaxed">
                Descubre la forma más inteligente de gestionar tus licencias, hardware y contratos en una única plataforma centralizada.
              </p>
              <Link
                to="/register"
                className="inline-block bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl"
              >
                Pruébalo Gratis
              </Link>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-12 shadow-2xl">
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <Calendar className="w-16 h-16 text-gray-800" />
                    <CheckCircle className="w-20 h-20 text-[#7ed321]" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    <div className="flex space-x-2 pt-2">
                      <div className="h-3 w-3 bg-gray-800 rounded"></div>
                      <div className="h-3 w-3 bg-gray-800 rounded"></div>
                      <div className="h-3 w-3 bg-gray-800 rounded"></div>
                      <div className="h-3 w-3 bg-gray-800 rounded"></div>
                      <div className="h-3 w-3 bg-gray-800 rounded"></div>
                      <div className="h-3 w-3 bg-gray-800 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#00a651] rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-[#7ed321] rounded-full opacity-20 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Una plataforma completa diseñada para empresas modernas que buscan eficiencia y control total
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00a651] to-[#008f45] rounded-xl flex items-center justify-center mb-6">
                <Package className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Gestión de Licencias
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Control total de licencias de software, vencimientos automáticos y asignaciones por usuario.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00a651] to-[#008f45] rounded-xl flex items-center justify-center mb-6">
                <HardDrive className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Inventario de Hardware
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Registro completo de equipos, especificaciones técnicas y ubicaciones en tiempo real.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00a651] to-[#008f45] rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Contratos de Soporte
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Administración centralizada de contratos, renovaciones y niveles de servicio.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00a651] to-[#008f45] rounded-xl flex items-center justify-center mb-6">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Alertas Inteligentes
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Notificaciones proactivas sobre vencimientos críticos y eventos importantes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00a651] to-[#008f45] rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Reportes Avanzados
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Análisis detallado de costos, utilización y tendencias para decisiones estratégicas.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00a651] to-[#008f45] rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Multi-Cliente
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Ideal para integradores: gestiona múltiples clientes desde una única plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Precios transparentes y flexibles
            </h2>
            <p className="text-xl text-gray-600">
              Elige el plan que mejor se adapte al tamaño y necesidades de tu organización
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-10 hover:shadow-lg transition-all">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-500 ml-2">/mes</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">1 usuario</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Hasta 50 activos</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Funciones básicas</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Soporte por email</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full bg-white border-2 border-gray-300 text-gray-900 text-center py-3.5 rounded-lg font-semibold hover:border-gray-400 transition-colors"
              >
                Comenzar Gratis
              </Link>
            </div>

            <div className="bg-gradient-to-br from-[#00a651] to-[#008f45] rounded-2xl p-10 relative transform hover:scale-105 transition-transform shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#7ed321] text-gray-900 px-6 py-2 rounded-full text-sm font-bold">
                MÁS POPULAR
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-white">$29</span>
                  <span className="text-white/80 ml-2">/mes</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#7ed321] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-white">Hasta 10 usuarios</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#7ed321] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-white">Activos ilimitados</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#7ed321] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-white">Todas las funciones</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#7ed321] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-white">Alertas avanzadas</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#7ed321] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-white">Reportes personalizados</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#7ed321] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-white">Soporte prioritario</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full bg-white text-[#00a651] text-center py-3.5 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Comenzar Ahora
              </Link>
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-10 hover:shadow-lg transition-all">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">Custom</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Usuarios ilimitados</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Activos ilimitados</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Multi-cliente (integradores)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">API personalizada</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">SLA garantizado</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-[#00a651] mr-3 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Soporte dedicado 24/7</span>
                </li>
              </ul>
              <button className="w-full bg-[#00a651] text-white text-center py-3.5 rounded-lg font-semibold hover:bg-[#008f45] transition-colors">
                Contactar Ventas
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center mb-4">
                <Radar className="w-10 h-10 text-[#00a651]" />
                <span className="ml-2 text-2xl font-bold">TraceTI</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                La solución empresarial completa para la gestión inteligente de activos IT
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Producto</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integraciones</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Casos de Uso</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Empresa</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Acerca de</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Términos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Seguridad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TraceTI. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
