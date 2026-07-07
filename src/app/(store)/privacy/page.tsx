import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Como a ${siteConfig.name} trata seus dados pessoais.`,
};

const SECTIONS = [
  {
    title: "1. Quem somos",
    body: `A ${siteConfig.name} é uma plataforma de delivery que conecta clientes, restaurantes parceiros e entregadores. Esta política descreve como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).`,
  },
  {
    title: "2. Dados que coletamos",
    body: "Podemos coletar: nome, e-mail, telefone, CPF (quando necessário para pagamento), endereço de entrega, histórico de pedidos, dados de pagamento (processados pelo Pagar.me — não armazenamos dados completos de cartão), localização do entregador durante a entrega ativa, e dados de uso da plataforma (logs, dispositivo, IP).",
  },
  {
    title: "3. Como usamos seus dados",
    body: "Utilizamos os dados para: processar e entregar pedidos; autenticar sua conta; comunicar status de pedidos; processar pagamentos; melhorar a experiência na plataforma; cumprir obrigações legais; e prevenir fraudes.",
  },
  {
    title: "4. Compartilhamento",
    body: "Compartilhamos dados apenas quando necessário: com o restaurante do seu pedido, com o entregador designado (nome, endereço e telefone de contato), com processadores de pagamento (Pagar.me), com provedores de infraestrutura (Supabase, Vercel) e quando exigido por lei. Não vendemos seus dados pessoais.",
  },
  {
    title: "5. Retenção e segurança",
    body: "Mantemos os dados pelo tempo necessário para prestar o serviço e cumprir obrigações legais. Aplicamos medidas técnicas e organizacionais como criptografia em trânsito (HTTPS), controle de acesso (RLS no banco de dados) e autenticação segura.",
  },
  {
    title: "6. Seus direitos (LGPD)",
    body: "Você pode solicitar: confirmação do tratamento, acesso, correção, anonimização, portabilidade, eliminação de dados desnecessários, revogação do consentimento e informação sobre compartilhamentos. Para exercer seus direitos, entre em contato pelo e-mail indicado abaixo.",
  },
  {
    title: "7. Cookies e armazenamento local",
    body: "Utilizamos cookies e armazenamento local para manter sua sessão autenticada, preferências e o carrinho de compras. Você pode limpar cookies pelo navegador, mas isso pode afetar o funcionamento da plataforma.",
  },
  {
    title: "8. Alterações",
    body: "Esta política pode ser atualizada periodicamente. A versão vigente estará sempre disponível nesta página, com a data da última atualização.",
  },
  {
    title: "9. Contato",
    body: `Dúvidas sobre privacidade: privacidade@nenosfood.com.br\nEncarregado de dados (DPO): dpo@nenosfood.com.br`,
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          ← Voltar ao início
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">Política de Privacidade</h1>
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
        <Link href="/terms" className="text-primary hover:underline">
          Ver Termos de Uso
        </Link>
      </p>
    </div>
  );
}
