import { useEffect, useState } from "react";

const RULES_SEEN_KEY = "face-to-face-rules-seen";

const sections = [
  {
    title: "Objetivo do jogo",
    content:
      "Descubra qual é o seu personagem secreto antes do adversário descobrir o dele",
  },
  {
    title: "❓ Como jogar sua vez",
    content:
      "Digite uma pergunta de sim/não sobre o seu personagem. O adversário responde. Use as respostas para marcar (clique esquerdo) ou descartar (clique direito) personagens no tabuleiro.",
  },

  {
    title: "🃏 O Coringa",
    content:
      "No início, cada jogador escolhe um personagem coringa — uma armadilha. Se o adversário apontar esse personagem como resposta final, ele perde na hora, voce tera visão da carta coringa do seu adversario que ficara marcada com a cor Preta.",
  },

  {
    title: "✅ Resposta Final",
    content:
      "Acertou seu segredo? Você vence! Errou (sem cair no coringa)? Nada perdido, mas o adversário ganha 2 perguntas extras seguidas.Voce tem a visão do personagem que seu adversario deve acertar ele ficara marcado com a cor Laranja.",
  },

  {
    title: "🏆 Fim de jogo",
    content:
      "O jogo termina quando alguém acerta seu próprio personagem ou cai no coringa do outro jogador.",
  },
];

function RulesButton() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(RULES_SEEN_KEY);
    if (!seen) {
      setIsOpen(true);
      localStorage.setItem(RULES_SEEN_KEY, "true");
    }
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Ver regras do jogo"
        className="fixed top-5 right-5 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center font-extrabold text-xl text-neutral-800 z-50 hover:brightness-95 active:scale-95 transition"
      >
        ?
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-xl text-neutral-800">
                Como Jogar
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {sections.map((s) => (
                <div key={s.title}>
                  <h3 className="font-bold text-neutral-800 text-sm mb-1">
                    {s.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {s.content}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-5 w-full h-12 rounded-xl font-extrabold bg-neutral-800 text-white hover:brightness-110 active:scale-[0.98] transition"
            >
              Entendi!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default RulesButton;
