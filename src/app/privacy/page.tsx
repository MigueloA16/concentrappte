import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f1a] text-white">
      <header className="border-b border-gray-800 bg-[#0f0f1a]">
        <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Shield className="h-6 w-6 mr-2 text-purple-400" />
              <span className="text-xl font-bold">Política de Privacidad</span>
            </Link>
          </div>

          <Link href="/" passHref>
            <Button variant="ghost" className="text-gray-300 hover:text-white flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container px-4 py-8 max-w-4xl mx-auto">
        <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Política de Privacidad</h1>
          <p className="text-gray-400 mb-4 text-center text-sm">Última actualización: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-bold mb-3 text-white">1. Introducción</h2>
              <p>
                En ConcentrAPPte, valoramos tu privacidad y nos comprometemos a proteger tus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos la información que nos proporcionas al utilizar nuestra aplicación y sitio web.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">2. Información que recopilamos</h2>
              <p>Podemos recopilar los siguientes tipos de información:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <span className="font-medium text-white">Información de la cuenta:</span> Cuando te registras, recopilamos tu dirección de correo electrónico, nombre de usuario y datos de uso.
                </li>
                <li>
                  <span className="font-medium text-white">Datos de perfil:</span> Información que eliges nombre, apodo y email.
                </li>
                <li>
                  <span className="font-medium text-white">Datos de uso:</span> Información sobre cómo utilizas la aplicación, incluyendo sesiones de enfoque, tiempo total, rachas y logros.
                </li>
                <li>
                  <span className="font-medium text-white">Información técnica:</span> Datos sobre el dispositivo y la conexión que utilizas para acceder a nuestro servicio.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">3. Cómo utilizamos tu información</h2>
              <p>Utilizamos la información recopilada para:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
                <li>Personalizar tu experiencia y las funcionalidades basadas en tus preferencias.</li>
                <li>Procesar y completar transacciones.</li>
                <li>Enviar notificaciones relacionadas con tu cuenta o actividad.</li>
                <li>Responder a tus consultas y proporcionar soporte al cliente.</li>
                <li>Analizar tendencias y comportamientos de uso para mejorar nuestra aplicación.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">4. Compartir tu información</h2>
              <p>
                No vendemos ni alquilamos tu información personal a terceros. Podemos compartir información en las siguientes circunstancias:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Con otros usuarios si participas en características sociales como grupos de estudio o desafíos.</li>
                <li>Con proveedores de servicios que nos ayudan a operar, mantener y mejorar nuestros servicios.</li>
                <li>Si lo requiere la ley o para proteger derechos, propiedad o seguridad.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">5. Seguridad de datos</h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro, y no podemos garantizar su absoluta seguridad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">6. Tus derechos</h2>
              <p>Dependiendo de tu ubicación, puedes tener los siguientes derechos:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Acceder a los datos personales que tenemos sobre ti.</li>
                <li>Corregir datos inexactos.</li>
                <li>Eliminar tus datos personales.</li>
                <li>Oponerte al procesamiento de tus datos.</li>
                <li>Retirar el consentimiento en cualquier momento.</li>
                <li>Presentar una queja ante una autoridad de protección de datos.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">7. Cambios a esta política</h2>
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios significativos publicando la nueva Política de Privacidad en esta página y/o mediante un correo electrónico.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">8. Contacto</h2>
              <p>
                Si tienes preguntas sobre esta Política de Privacidad, contáctanos en:
                <a href="mailto:concentrappte@gmail.com" className="text-purple-400 ml-1 hover:underline">
                  concentrappte@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 bg-[#0f0f1a]">
        <div className="container px-4 py-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-sm text-gray-400">
              &copy; {new Date().getFullYear()} ConcentrAPPte. Todos los derechos reservados.
            </div>
            <div className="flex space-x-4 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-purple-400">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-purple-400">
                Terms
              </Link>
              <a href="mailto:concentrappte@gmail.com" className="hover:text-purple-400">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}