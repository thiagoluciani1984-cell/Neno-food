import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: `Termos e condições de uso da plataforma ${siteConfig.name}.`,
};

const SECTIONS = [
  {
    title: "1. Aceitação dos termos",
    body: `Ao acessar ou utilizar a plataforma ${siteConfig.name}, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço. Estes termos se aplicam a clientes, restaurantes parceiros e entregadores cadastrados.`,
  },
  {
    title: "2. O serviço",
    body: `${siteConfig.name} é uma plataforma intermediária de delivery. Não somos restaurante nem operador logístico: conectamos você aos estabelecimentos parceiros e, quando aplicável, a entregadores independentes. Cardápios, preços, prazos e qualidade dos produtos são de responsabilidade do restaurante.`,
  },
  {
    title: "3. Cadastro e conta",
    body: "Você deve fornecer informações verdadeiras e manter sua senha em sigilo. É proibido criar contas falsas, usar dados de terceiros sem autorização ou compartilhar credenciais. Reservamo-nos o direito de suspender contas que violem estes termos.",
  },
  {
    title: "4. Pedidos e pagamentos",
    body: "Ao confirmar um pedido, você declara ciência dos itens, valores, taxa de entrega e forma de pagamento escolhida. Pagamentos online (PIX) são processados pelo Pagar.me. Pagamentos na entrega são acordados diretamente com o entregador ou restaurante conforme a opção selecionada.",
  },
  {
    title: "5. Cancelamentos e reembolsos",
    body: "Cancelamentos seguem a política do restaurante e o status do pedido. Pedidos já em preparo ou entrega podem não ser canceláveis. Reembolsos de pagamentos online serão processados conforme as regras do meio de pagamento e análise do caso.",
  },
  {
    title: "6. Entregas",
    body: "Prazos de entrega são estimativas. Atrasos podem ocorrer por fatores externos (trânsito, clima, alta demanda). O código PIN de confirmação deve ser informado apenas ao entregador no momento da entrega do seu pedido.",
  },
  {
    title: "7. Conduta do usuário",
    body: "É proibido: fraudar pagamentos, assediar outros usuários, publicar conteúdo ilegal ou ofensivo no feed, manipular avaliações, tentar acessar áreas restritas do sistema ou usar a plataforma para fins ilícitos.",
  },
  {
    title: "8. Propriedade intelectual",
    body: `A marca ${siteConfig.name}, logotipos, interface e software da plataforma são protegidos por direitos autorais. Conteúdos publicados por restaurantes (fotos, textos) permanecem de propriedade dos respectivos titulares, com licença de exibição na plataforma.`,
  },
  {
    title: "9. Limitação de responsabilidade",
    body: "Na extensão permitida pela lei, não nos responsabilizamos por danos indiretos, lucros cessantes ou problemas decorrentes de alimentos preparados por terceiros. Nossa responsabilidade limita-se à intermediação tecnológica do pedido.",
  },
  {
    title: "10. Alterações e legislação",
    body: "Podemos alterar estes termos a qualquer momento, publicando a versão atualizada nesta página. Aplica-se a legislação brasileira. Foro: comarca da sede da plataforma, salvo disposição legal em contrário.",
  },
  {
    title: "11. Contato",
    body: "Dúvidas sobre estes termos: suporte@nenosfood.com.br",
  },
] as const;

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          ← Voltar ao início
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString("pt-BR")} · {siteConfig.name}
        </p>
      </div>

      <div className="space-y-8 rounded-3xl border border-orange-100 bg-white p-6 sm:p-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link href="/privacy" className="text-primary hover:underline">
          Ver Política de Privacidade
        </Link>
      </p>
    </div>
  );
}
