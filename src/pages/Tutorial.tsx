import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BookOpen, AlertCircle, Laptop, CheckCircle2 } from 'lucide-react'

export default function Tutorial() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tutorial de Acesso e Uso</h2>
        <p className="text-muted-foreground mt-1">Guia passo a passo para Responsáveis de Grupo.</p>
      </div>

      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Laptop className="w-5 h-5" />
            1. Como Acessar o Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed pt-6">
          <p className="text-base">
            Acesse o sistema diretamente pelo link oficial:{' '}
            <a
              href="https://relatoriosmacaubas.goskip.app"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-semibold bg-primary/10 px-2 py-0.5 rounded-sm"
            >
              https://relatoriosmacaubas.goskip.app
            </a>
          </p>

          <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-5 mt-4">
            <h4 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Contas Autorizadas (Responsáveis)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
              <div className="flex items-center gap-2 p-2 bg-background rounded border shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-medium">Ricardo Valença:</span>
                <span className="text-muted-foreground">rvalenca@jwpub.org</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded border shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-medium">Emanuel Carvalho:</span>
                <span className="text-muted-foreground">emanuelcarvalho45@jwpub.org</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded border shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-medium">Jailton Conceição:</span>
                <span className="text-muted-foreground">jailtonc9@jwpub.org</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded border shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-medium">Gilmar Batista:</span>
                <span className="text-muted-foreground">gilmard3@jwpub.org</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded border shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-medium">Willemberg Weber:</span>
                <span className="text-muted-foreground">willembergdasilva3@jwpub.org</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded border shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-medium">Gleidson Gomes:</span>
                <span className="text-muted-foreground">ggleidson@jwpub.org</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
              <p className="text-base">
                <strong className="text-amber-800 dark:text-amber-400">Senha Padrão:</strong>{' '}
                <code className="bg-background px-2 py-1 rounded text-lg font-bold border">
                  123@Senha
                </code>
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-2 flex items-start gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Atenção: A letra "S" deve ser maiúscula. Caso tenha dificuldades, verifique se não
                há espaços em branco ao copiar e colar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            2. Como Lançar os Relatórios (Entrada de Dados do Grupo)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                1
              </div>
              <div>
                <h5 className="text-base font-semibold">Faça o Login</h5>
                <p className="text-muted-foreground mt-1">
                  Utilize seu email autorizado e a senha padrão informada acima.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                2
              </div>
              <div>
                <h5 className="text-base font-semibold">Navegue até a Entrada de Dados</h5>
                <p className="text-muted-foreground mt-1">
                  No menu lateral esquerdo, clique na opção <strong>"Entrada de Dados"</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                3
              </div>
              <div>
                <h5 className="text-base font-semibold">Selecione o Período</h5>
                <p className="text-muted-foreground mt-1">
                  No topo da tela, escolha o <strong>Mês</strong> e o <strong>Ano</strong>{' '}
                  correspondentes ao relatório que deseja preencher.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                4
              </div>
              <div>
                <h5 className="text-base font-semibold">Preencha os Dados dos Publicadores</h5>
                <p className="text-muted-foreground mt-1 mb-2">
                  O sistema carregará automaticamente a lista de todos os publicadores do seu grupo.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    Marque a caixa verde <strong>"Participou no Ministério"</strong> caso o
                    publicador tenha saído no campo.
                  </li>
                  <li>
                    Se o publicador dirigiu estudos bíblicos, informe a quantidade no campo numérico{' '}
                    <strong>"Estudos"</strong>.
                  </li>
                  <li>
                    Se o publicador for pioneiro (regular ou auxiliar) ou tiver aprovação para
                    relatar horas, preencha o campo numérico <strong>"Horas"</strong>.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                5
              </div>
              <div>
                <h5 className="text-base font-semibold">Salve as Informações</h5>
                <p className="text-muted-foreground mt-1">
                  Após preencher e conferir os dados de todos do grupo, role até o final da página e
                  clique no botão azul <strong>"Salvar Relatórios"</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-blue-800 dark:text-blue-300">Dica Prática</h5>
              <p className="text-blue-700 dark:text-blue-400/90 mt-1">
                Ao lançar os dados, você pode clicar na linha ou no nome de qualquer publicador para
                visualizar um breve histórico dos últimos meses. Isso ajuda a lembrar se ele estava
                regular ou inativo recentemente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
