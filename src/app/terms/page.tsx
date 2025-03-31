import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f1a] text-white">
      <header className="border-b border-gray-800 bg-[#0f0f1a]">
        <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <FileText className="h-6 w-6 mr-2 text-purple-400" />
              <span className="text-xl font-bold">Términos de Servicio</span>
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
          <h1 className="text-3xl font-bold mb-6 text-center">Términos de Servicio</h1>
          <p className="text-gray-400 mb-4 text-center text-sm">Última actualización: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-bold mb-3 text-white">1. Aceptación de los Términos</h2>
              <p>
                Al acceder o utilizar ConcentrAPPte, aceptas estar legalmente obligado por estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">2. Cambios en los Términos</h2>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos de cualquier cambio publicando los nuevos Términos de Servicio en esta página. Los cambios entrarán en vigor inmediatamente después de su publicación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">3. Cuentas de Usuario</h2>
              <p>Al crear una cuenta con nosotros, aceptas lo siguiente:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Mantener la confidencialidad de tu contraseña y ser responsable de todas las actividades que ocurran bajo tu cuenta.</li>
                <li>Notificarnos inmediatamente sobre cualquier brecha de seguridad o uso no autorizado de tu cuenta.</li>
                <li>No usar el servicio para fines ilegales o no autorizados.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">4. Comportamiento del Usuario</h2>
              <p>
                Al utilizar nuestro servicio, aceptas no:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Violar ninguna ley o regulación aplicable.</li>
                <li>Publicar o transmitir contenido ilegal, abusivo, difamatorio, discriminatorio o inapropiado.</li>
                <li>Hacerte pasar por otra persona o entidad.</li>
                <li>Interferir o interrumpir el servicio o los servidores o redes conectadas al servicio.</li>
                <li>Recopilar o almacenar datos personales de otros usuarios sin su consentimiento.</li>
                <li>Utilizar el servicio de cualquier manera que pueda dañar, deshabilitar o sobrecargar el servicio.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">5. Propiedad Intelectual</h2>
              <p>
                El servicio y su contenido original, características y funcionalidad son propiedad de ConcentrAPPte y están protegidos por derechos de autor, marcas registradas, patentes, secretos comerciales y otras leyes de propiedad intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">6. Contenido del Usuario</h2>
              <p>
                Al publicar contenido en nuestro servicio, nos otorgas una licencia mundial, no exclusiva, libre de regalías para usar, reproducir, procesar, adaptar, publicar, transmitir, mostrar y distribuir dicho contenido en cualquier medio o método de distribución.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">7. Terminación</h2>
              <p>
                Podemos terminar o suspender tu cuenta inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo, sin limitación, si incumples los Términos de Servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">8. Limitación de Responsabilidad</h2>
              <p>
                En ningún caso ConcentrAPPte, sus directores, empleados o agentes serán responsables por cualquier daño indirecto, incidental, especial, consecuente o punitivo, incluyendo sin limitación, pérdida de beneficios, datos, uso, buena voluntad, u otras pérdidas intangibles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">9. Exención de Garantías</h2>
              <p>
                Tu uso del servicio es bajo tu propio riesgo. El servicio se proporciona "tal cual" y "según disponibilidad" sin garantías de ningún tipo, ya sean expresas o implícitas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">10. Legislación Aplicable</h2>
              <p>
                Estos Términos se regirán e interpretarán de acuerdo con las leyes aplicables, sin consideración de sus conflictos de disposiciones legales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-white">11. Contacto</h2>
              <p>
                Si tienes alguna pregunta sobre estos Términos, contáctanos en:
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
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-purple-400">
                Términos de Uso
              </Link>
              <a href="mailto:concentrappte@gmail.com" className="hover:text-purple-400">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}