import { PaginaEncuesta } from "@/components/encuesta/pagina-encuesta";

interface Props {
  params: Promise<{ negocioId: string }>;
}

export default async function EncuestaPage({ params }: Props) {
  const { negocioId } = await params;
  return <PaginaEncuesta negocioId={negocioId} />;
}

export const metadata = {
  title: "Califica tu experiencia · Uqbar",
  description: "Déjanos saber cómo estuvo tu servicio.",
};
