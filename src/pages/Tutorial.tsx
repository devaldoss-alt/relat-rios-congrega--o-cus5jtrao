import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function Tutorial() {
  return (
    <div className="space-y-6 pb-10 max-w-4xl mx-auto animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tutorial de Uso</h2>
        <p className="text-muted-foreground mt-1">
          Aprenda como utilizar as funcionalidades do sistema focadas no registro de relatórios do
          seu grupo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Como Lançar os Relatórios (Entrada de Dados do Grupo)
          </CardTitle>
          <CardDescription>
            Passo a passo detalhado para registrar os relatórios do seu grupo de serviço de campo,
            garantindo que os dados sejam preenchidos de forma correta e eficiente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Acesse a Entrada de Dados</h3>
                <p className="text-muted-foreground">
                  No menu lateral principal, procure pela opção <strong>"Entradas de dados"</strong>{' '}
                  e em seguida selecione <strong>"Entrada de Dados do Grupo"</strong>. É nesta seção
                  que todos os lançamentos devem ser realizados.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Preenchimento dos Campos e Validações</h3>
                <p className="text-muted-foreground mb-2">
                  A página listará todos os publicadores do seu grupo. Ao informar os dados, observe
                  as validações aplicadas em tempo real:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>
                    <strong>Participou do Ministério:</strong> Se o publicador pregou, mas não
                    possui exigência de horas, basta marcar esta opção.
                  </li>
                  <li>
                    <strong>Horas:</strong> O lançamento de horas é restrito ou exigido dependendo
                    do tipo do publicador (por exemplo, é obrigatório para Pioneiros Regulares ou
                    Auxiliares).
                  </li>
                  <li>
                    <strong>Estudos Bíblicos:</strong> Informe a quantidade de estudos dirigidos no
                    mês, se houver.
                  </li>
                  <li>
                    <strong>Observações:</strong> Campo opcional para adicionar notas relevantes
                    sobre a atividade do mês.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Atenção aos Alertas Visuais</h3>
                <p className="text-muted-foreground">
                  O sistema ajudará você a identificar rapidamente o que está faltando. Fique de
                  olho em indicativos de aviso, como{' '}
                  <strong>destaques em vermelho ou mensagens na tela</strong>, que alertam sobre
                  pendências e publicadores que ainda não tiveram seus relatórios submetidos.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Confira o Histórico</h3>
                <p className="text-muted-foreground">
                  Precisa consultar um relatório já enviado? Acesse a seção{' '}
                  <strong>"Histórico de Relatórios"</strong> através do menu. Lá você encontrará
                  todas as submissões anteriores do grupo, permitindo um acompanhamento claro do
                  trabalho realizado.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
