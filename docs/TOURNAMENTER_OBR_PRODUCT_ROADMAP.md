# Valhalla Product Roadmap

Roadmap de produto para transpor o ecossistema `Tournamenter` + `TournamenterApp` + `tournamenter-obr` para o `Valhalla`, já assumindo que o `Valhalla` é um sistema específico da OBR e não um host genérico com plugins.

## Objetivo

Mapear todas as funcionalidades hoje existentes no ecossistema Tournamenter OBR e decidir, para cada uma delas, se o `Valhalla` deve:

- portar quase literalmente
- adaptar para a realidade OBR/web/offline-first
- não portar

Este documento também deixa um backlog desmembrado em itens que podem virar issues com label `feature-requested` no repositório do `Valhalla`.

## Fontes mapeadas

### Tournamenter Core

- Gestão de equipes
- Gestão de grupos e partidas
- Gestão de tabelas/rankings
- Gestão de views públicas com páginas modulares
- Exportação CSV de tabelas
- Branding, autenticação simples e configuração por ambiente
- Extensibilidade por módulos
- Backup/restore do banco

Arquivos-chave:

- `Tournamenter/README.md`
- `Tournamenter/models/*.js`
- `Tournamenter/controllers/*.js`
- `Tournamenter/modules/*`

### TournamenterApp

- Criação e configuração de instâncias locais
- Start/stop de múltiplos servidores
- Instalação e remoção de extensões
- Logs operacionais
- Descoberta de IPs para abrir o sistema na rede local
- Atualização do app e das extensões

Arquivos-chave:

- `TournamenterApp/README.md`
- `TournamenterApp/controllers/ServerRunner.js`
- `TournamenterApp/controllers/ExtensionManager.js`
- `TournamenterApp/public/app/ServerRunner.js`

### tournamenter-obr

- Pontuador da OBR via tablet
- Regras e sorters específicos da OBR
- Scorers versionados por ano/etapa
- Importação de equipes do Olimpo
- Envio automático/manual de notas ao Olimpo
- Gerador de horários de rounds
- Desafio surpresa
- Home operacional e manual em PDF

Arquivos-chave:

- `tournamenter-obr/index.js`
- `tournamenter-obr/SyncModule.js`
- `tournamenter-obr/public/tournamenter-obr/obr-*.ejs`
- `tournamenter-obr/public/tournamenter-obr/scripts_*/*.js`
- `tournamenter-obr/public/tournamenter-obr/scripts/scorers.js`
- `tournamenter-obr/sorters/*.js`

## Inventário de funcionalidades

### Core de torneio

1. Equipes: CRUD, nome, país/cidade, categoria externa.
2. Tabelas: CRUD, cabeçalhos customizados, múltiplas colunas, colunas específicas para view pública.
3. Ranking configurável: `sort asc/desc`, algoritmo customizável por `evaluateMethod`.
4. Scores por equipe: armazenamento por coluna com `value` e `data`.
5. Grupos e partidas: CRUD, agenda, campo, placar, estado da partida.
6. Tabela automática de grupos: pontos, vitórias, derrotas, empates, saldo.
7. Views públicas: coleção de páginas rotativas para TV/projetor/web.
8. Módulos de páginas públicas:
   tabela, grupo, partida ao vivo, bracket, imagem, mensagem em markdown.
9. Branding do evento: nome e logo.
10. Login simples por senha única.
11. Exportação CSV de tabelas.
12. Backup e restore do banco.

### Operação desktop/local

13. Gerenciador de múltiplas instâncias de servidor.
14. Configuração de porta, senha, logo e caminho do banco por instância.
15. Start/stop individual e em lote.
16. Logs em tempo real por instância.
17. Abrir a aplicação pelo IP local da máquina.
18. Instalação de extensões a partir de pacote/npm/GitHub.
19. Atualização do desktop app.
20. Atualização de extensões.

### OBR

21. Home operacional da OBR.
22. Pontuador Rescue via tablet.
23. Regras Rescue versionadas por ano e etapa.
24. Regras Artistic com sorter dedicado.
25. Dados ricos de score por missão, não apenas valor final.
26. Temporizador de round e controle de tempo máximo.
27. Seleção de equipe/round para gravar score.
28. Regravação protegida de nota já existente.
29. Carregamento de score já salvo para conferência/edição.
30. Importação de equipes do Olimpo.
31. Mapeamento de metadados externos por equipe: `olimpoId`, `stepId`, `token`.
32. Sincronização automática/manual das notas com o Olimpo.
33. Status visual da sincronização e timestamp da última sincronização.
34. Gerador de horários dos 3 rounds.
35. Exportação dos horários em CSV.
36. Geração de markdown para views públicas de horários.
37. Impressão das tabelas de horários.
38. Desafio surpresa com geração controlada por equipe.
39. Persistência dos desafios gerados.
40. Manual operacional para organização.

## Decisão de produto: portar, adaptar ou não portar

### Portar

Estas funcionalidades fazem parte do núcleo do produto OBR do `Valhalla`:

- administração de evento
- gestão de equipes
- pontuação rescue e artística
- regras versionadas por ano/etapa
- ranking em tempo real
- importação de equipes do Olimpo
- sincronização de notas com o Olimpo
- gerador de horários de rounds
- desafio surpresa
- exportações operacionais
- auditoria e revisão de scores
- backup/restore
- telas públicas da competição

### Adaptar

Estas existem no ecossistema legado, mas no `Valhalla` devem mudar de forma:

- `TournamenterApp` multi-instância:
  adaptar para deployment local, instalador, modo appliance ou painel de operação, não como gerenciador Electron separado.
- view builder genérico:
  adaptar para um conjunto menor de “modos públicos OBR” em vez de um construtor genérico de páginas.
- branding totalmente genérico:
  adaptar para branding do evento OBR dentro de limites definidos.
- senha única do legado:
  adaptar para papéis explícitos do `Valhalla` (`ADMIN`, `REFEREE`, `SECRETARIAT`, público).

### Não portar

Estas não são prioridade de produto para um sistema focado em OBR:

- sistema genérico de extensões/plugins instaláveis em runtime
- bracket genérico de campeonatos
- grupos e partidas em estilo futebol, salvo se surgir modalidade OBR que realmente exija isso
- gerenciador desktop separado para instalar módulos externos

## Roadmap por fase

### Fase 1 — Paridade operacional mínima

Objetivo: tornar o `Valhalla` utilizável em um evento real da OBR sem depender do Tournamenter legado.

- setup e administração do evento
- cadastro/importação de equipes
- fluxo completo de pontuação rescue
- fluxo completo de pontuação artística
- ranking público em tempo real
- configuração de arenas
- secretaria/check-in
- exportação básica
- backup/restore

### Fase 2 — Paridade OBR avançada

Objetivo: cobrir o que hoje existe no plugin OBR para operação nacional/regional.

- regras versionadas por temporada e etapa
- sincronização com Olimpo
- gerador de rounds
- desafio surpresa
- auditoria e revisão de notas
- histórico operacional das sincronizações
- material de apoio/manual dentro do sistema

### Fase 3 — Experiência pública e operação local

Objetivo: superar o legado em apresentação pública e robustez de operação local.

- modos públicos dedicados para TV/projetor
- anúncios/mensagens operacionais
- exportações e impressões melhores
- observabilidade e diagnósticos
- empacotamento para uso offline/local network

### Fase 4 — Diferenciais do Valhalla

Objetivo: ir além do legado.

- trilha de auditoria completa
- versionamento formal de regulamentos
- onboarding guiado
- assistentes operacionais com IA
- importação/exportação estruturada
- automações de secretaria e checagem de consistência

## Backlog pronto para issues

Cada item abaixo já está no formato adequado para abrir issue com label `feature-requested`.

### VH-001 — Setup inicial de evento OBR

- Labels sugeridas: `feature-requested`, `area:admin`, `priority:p0`
- Fonte: `Valhalla` atual + `Tournamenter` core
- Status atual: parcial
- Descrição:
  Permitir criar e inicializar um evento OBR completo, com identidade do evento, datas, local, senhas/papéis e configurações iniciais obrigatórias.
- Valor:
  Sem isso não existe fluxo consistente de primeira execução em produção.
- Escopo:
  criação de evento, ativação do evento, metadados básicos, branding básico e validações mínimas.
- Critérios de aceite:
  o sistema inicia vazio e permite criar um evento funcional
  o evento pode ser marcado como ativo
  as informações do evento aparecem nas telas administrativas e públicas

### VH-002 — Gestão completa de equipes

- Labels sugeridas: `feature-requested`, `area:teams`, `priority:p0`
- Fonte: `Tournamenter/models/Team.js`, `Tournamenter/controllers/Team.js`
- Status atual: parcial
- Descrição:
  Disponibilizar CRUD completo de equipes com dados usados pela OBR e estados operacionais como presença confirmada.
- Valor:
  equipes são a unidade base de toda a operação de pontuação e ranking.
- Escopo:
  cadastrar, editar, remover, listar, filtrar e confirmar presença.
- Critérios de aceite:
  admin e secretaria conseguem gerenciar equipes
  a listagem suporta filtros úteis para operação
  mudanças refletem nos fluxos de pontuação e ranking

### VH-003 — Importação de equipes do Olimpo

- Labels sugeridas: `feature-requested`, `area:integrations`, `priority:p0`
- Fonte: `tournamenter-obr/public/tournamenter-obr/scripts_config/importar.js`
- Status atual: ausente
- Descrição:
  Importar equipes do Olimpo para o evento, calculando diferenças antes de aplicar mudanças no banco local.
- Valor:
  reduz retrabalho manual e mantém o cadastro alinhado com a fonte oficial.
- Escopo:
  informar token do evento, buscar participantes, comparar com base local e aplicar create/update controlado.
- Critérios de aceite:
  o usuário visualiza as diferenças antes de confirmar
  o sistema informa quantas equipes serão criadas/atualizadas
  metadados externos necessários para sync posterior são persistidos

### VH-004 — Metadados de integração por equipe

- Labels sugeridas: `feature-requested`, `area:integrations`, `priority:p0`
- Fonte: `tournamenter-obr/SyncModule.js`, `scripts_config/importar.js`
- Status atual: ausente
- Descrição:
  Guardar em cada equipe os metadados exigidos pelo ecossistema OBR, como `olimpoId`, `stepId` e `token`.
- Valor:
  isso viabiliza sincronização automática e rastreabilidade com sistemas externos.
- Critérios de aceite:
  metadados externos existem no modelo de dados
  importação e sync usam o mesmo conjunto de campos
  a ausência desses dados é tratada de forma explícita

### VH-005 — Fluxo completo de pontuação Rescue

- Labels sugeridas: `feature-requested`, `area:scoring`, `priority:p0`
- Fonte: `tournamenter-obr/public/tournamenter-obr/scripts/controllers.js`, `views/scorer.html`
- Status atual: parcial
- Descrição:
  Implementar o fluxo completo do árbitro para escolher categoria, equipe, arena, lançar score, controlar tempo e persistir a rodada.
- Valor:
  é o coração operacional do produto em evento real.
- Escopo:
  seleção de equipe, lançamento por colunas/missões, timer, confirmação de gravação e retorno rápido para próxima equipe.
- Critérios de aceite:
  o árbitro consegue concluir uma pontuação inteira sem sair do fluxo
  o tempo do round pode ser usado como parte do score
  o sistema confirma gravação com feedback claro

### VH-006 — Regras versionadas de Rescue por ano e etapa

- Labels sugeridas: `feature-requested`, `area:rules`, `priority:p0`
- Fonte: `tournamenter-obr/public/tournamenter-obr/scripts/scorers.js`, `views/rescue_scorer_*`
- Status atual: ausente
- Descrição:
  Modelar regulamentos versionados para Rescue, separados por ano e por etapa regional/nacional, sem exigir duplicação manual de telas a cada temporada.
- Valor:
  a OBR muda todo ano; sem isso o produto envelhece rápido.
- Escopo:
  catálogo de regulamentos, binding entre evento/categoria e regulamento, campos específicos de cada temporada.
- Critérios de aceite:
  o admin seleciona a regra aplicável
  o formulário de score muda conforme a temporada
  ranking e sync usam o mesmo regulamento

### VH-007 — Fluxo completo de pontuação Artística

- Labels sugeridas: `feature-requested`, `area:scoring`, `priority:p0`
- Fonte: `tournamenter-obr/sorters/artistica2025.js`, convenções de colunas do plugin
- Status atual: parcial
- Descrição:
  Consolidar o fluxo de pontuação da modalidade artística com critérios, colunas, cálculo final e desempates específicos.
- Valor:
  garante cobertura das modalidades centrais da OBR.
- Critérios de aceite:
  categorias artísticas possuem configuração própria
  o árbitro consegue lançar a nota completa
  o ranking aplica a fórmula oficial selecionada

### VH-008 — Motor de regras e fórmulas OBR

- Labels sugeridas: `feature-requested`, `area:rules`, `priority:p0`
- Fonte: `Tournamenter/models/Table.js`, `tournamenter-obr/sorters/*.js`
- Status atual: parcial
- Descrição:
  Evoluir o mecanismo de scoring para suportar fórmulas, desempates e regras oficiais sem espalhar lógica pela interface.
- Valor:
  reduz regressões anuais e simplifica evolução do produto.
- Critérios de aceite:
  regras de ranking são configuráveis e testáveis
  há separação entre score bruto e score calculado
  desempates oficiais podem ser expressos sem hacks na UI

### VH-009 — Dados ricos de score por missão

- Labels sugeridas: `feature-requested`, `area:scoring`, `priority:p0`
- Fonte: `Tournamenter/models/Scores.js`, `controllers/Scores.js`
- Status atual: parcial
- Descrição:
  Armazenar não só o valor final de cada coluna, mas também a estrutura detalhada da pontuação por missão/tentativa.
- Valor:
  necessário para auditoria, reedição, sync e evolução anual das regras.
- Critérios de aceite:
  cada submissão persiste score bruto e score derivado
  é possível reconstruir a tela de edição a partir do banco
  o ranking usa o score calculado, não perde o detalhe bruto

### VH-010 — Edição e revisão de notas já lançadas

- Labels sugeridas: `feature-requested`, `area:scoring`, `priority:p1`
- Fonte: `controllers.js` do plugin OBR
- Status atual: parcial
- Descrição:
  Permitir abrir uma nota existente, revisar dados e substituir a pontuação de forma controlada.
- Valor:
  eventos reais exigem correção operacional e conferência.
- Critérios de aceite:
  o score salvo pode ser reaberto
  alterações ficam claras para o usuário
  a substituição de nota tem proteção apropriada

### VH-011 — Auditoria de pontuação

- Labels sugeridas: `feature-requested`, `area:audit`, `priority:p1`
- Fonte: necessidade operacional derivada do legado
- Status atual: ausente
- Descrição:
  Registrar quem lançou, editou ou reenviou cada nota, quando isso ocorreu e quais valores mudaram.
- Valor:
  dá segurança à organização e reduz conflitos em evento.
- Critérios de aceite:
  toda alteração de score gera trilha de auditoria
  o admin consegue inspecionar histórico por equipe/arena/categoria

### VH-012 — Sincronização manual e automática com o Olimpo

- Labels sugeridas: `feature-requested`, `area:integrations`, `priority:p0`
- Fonte: `tournamenter-obr/SyncModule.js`, `scripts_config/exportar.js`
- Status atual: ausente
- Descrição:
  Enviar periodicamente ou sob demanda os resultados para o sistema oficial do Olimpo.
- Valor:
  elimina a dependência do Tournamenter legado na operação oficial da OBR.
- Critérios de aceite:
  o admin pode habilitar sync automático
  o intervalo é configurável dentro de limites válidos
  existe envio manual imediato

### VH-013 — Status, erros e histórico de sincronização

- Labels sugeridas: `feature-requested`, `area:integrations`, `priority:p1`
- Fonte: `SyncModule.js`, `obr-config.ejs`
- Status atual: ausente
- Descrição:
  Exibir o estado atual da sincronização, último sucesso, falhas recentes e mensagens de diagnóstico.
- Valor:
  sem observabilidade a integração oficial vira caixa-preta.
- Critérios de aceite:
  o usuário vê se o sync está ligado, desligado ou falhou
  a última sincronização bem-sucedida é mostrada
  erros retornados pela integração são visíveis

### VH-014 — Gerador de horários de rounds

- Labels sugeridas: `feature-requested`, `area:scheduling`, `priority:p0`
- Fonte: `obr-rounds.ejs`, `scripts_rounds/app.js`
- Status atual: ausente
- Descrição:
  Gerar automaticamente as tabelas de horário dos 3 rounds com base em duração, arenas, dificuldades e pausas.
- Valor:
  reduz trabalho manual crítico da organização.
- Critérios de aceite:
  a organização informa arenas, horários de início e pausas
  o sistema gera 3 tabelas utilizáveis
  conflitos e inconsistências são apontados

### VH-015 — Exportação operacional de horários

- Labels sugeridas: `feature-requested`, `area:scheduling`, `priority:p1`
- Fonte: `scripts_rounds/app.js`
- Status atual: ausente
- Descrição:
  Exportar os horários gerados em CSV, markdown para view pública e modo de impressão.
- Valor:
  permite circular rapidamente horários para equipes, telões e staff.
- Critérios de aceite:
  cada rodada pode ser exportada em CSV
  existe cópia em markdown para exibição pública
  o layout é imprimível em formato legível

### VH-016 — Desafio surpresa

- Labels sugeridas: `feature-requested`, `area:competition`, `priority:p1`
- Fonte: `obr-desafio.ejs`, `scripts_desafio/desafio.js`
- Status atual: parcial
- Descrição:
  Disponibilizar fluxo para gerar e registrar desafios surpresa por equipe, com controle de geração única e visualização posterior.
- Valor:
  cobre um fluxo operacional presente no plugin OBR legado.
- Critérios de aceite:
  o usuário escolhe tabela e equipe
  o sistema gera desafio válido para o nível da equipe
  desafios já gerados ficam persistidos e visíveis

### VH-017 — Modos públicos de exibição

- Labels sugeridas: `feature-requested`, `area:public-display`, `priority:p1`
- Fonte: `Tournamenter/modules/pageview-*`, `controllers/View.js`
- Status atual: parcial
- Descrição:
  Criar modos públicos específicos da OBR para TVs, telões e páginas abertas ao público.
- Valor:
  substitui a parte mais útil do sistema de views sem trazer toda a genericidade do Tournamenter.
- Escopo inicial:
  ranking público, horários, mensagens, tela de chamada e tela de resultados por categoria.
- Critérios de aceite:
  os modos públicos atualizam em tempo real
  existem layouts próprios para telão e notebook
  o admin escolhe facilmente o modo de exibição

### VH-018 — Mensagens e avisos públicos

- Labels sugeridas: `feature-requested`, `area:public-display`, `priority:p2`
- Fonte: `Tournamenter/modules/pageview-message`
- Status atual: ausente
- Descrição:
  Permitir publicar avisos operacionais, instruções e comunicados em telas públicas.
- Valor:
  substitui a `message view` genérica por um recurso útil para OBR.
- Critérios de aceite:
  admin/secretaria conseguem publicar mensagem
  a mensagem pode ser exibida em modo público
  conteúdo suporta texto rico básico

### VH-019 — Branding do evento

- Labels sugeridas: `feature-requested`, `area:branding`, `priority:p2`
- Fonte: `Tournamenter/config/config.js`, `controllers/Api.js`
- Status atual: parcial
- Descrição:
  Permitir logo, nome curto, nome público e identidade básica do evento OBR.
- Valor:
  melhora identificação em telas públicas e materiais exportados.
- Critérios de aceite:
  branding aparece em login, dashboards, ranking e modos públicos
  logo do evento pode ser configurado sem quebrar layouts

### VH-020 — Exportação CSV de ranking e resultados

- Labels sugeridas: `feature-requested`, `area:exports`, `priority:p1`
- Fonte: `Tournamenter/controllers/Table.js`
- Status atual: ausente
- Descrição:
  Exportar resultados e rankings em CSV com codificação apropriada para uso em planilhas.
- Valor:
  atende relatórios, conferência e comunicação externa.
- Critérios de aceite:
  categoria/ranking podem ser exportados
  o CSV abre corretamente em ferramentas comuns
  cabeçalhos seguem o regulamento da categoria

### VH-021 — Backup e restore do evento

- Labels sugeridas: `feature-requested`, `area:ops`, `priority:p1`
- Fonte: `Tournamenter/helpers/Backup.js`
- Status atual: ausente
- Descrição:
  Permitir backup manual e automático, além de restore controlado do banco do evento.
- Valor:
  essencial para operação local/offline em ambiente crítico.
- Critérios de aceite:
  o admin consegue gerar backup sob demanda
  existe política de backup automático configurável
  restore é possível com validações e confirmação explícita

### VH-022 — Operação local/offline-first para rede do evento

- Labels sugeridas: `feature-requested`, `area:ops`, `priority:p1`
- Fonte: visão combinada de `Tournamenter` + `TournamenterApp`
- Status atual: parcial
- Descrição:
  Consolidar a experiência de uso local em rede interna do evento, com descoberta simples de endereço, persistência local e instruções de deployment.
- Valor:
  essa é uma premissa central do `Valhalla`.
- Critérios de aceite:
  a organização consegue subir o sistema sem depender de internet
  a documentação de operação local é objetiva
  o sistema funciona em rede local entre secretaria, árbitros e público

### VH-023 — Empacotamento de distribuição para eventos

- Labels sugeridas: `feature-requested`, `area:ops`, `priority:p2`
- Fonte: `TournamenterApp`
- Status atual: ausente
- Descrição:
  Definir uma forma oficial de distribuição do `Valhalla` para uso em eventos: Docker, pacote desktop, instalador local ou appliance.
- Valor:
  substitui o papel prático do `TournamenterApp` sem copiar sua arquitetura.
- Critérios de aceite:
  existe um caminho oficial recomendado para rodar em evento
  esse caminho cobre banco, persistência e atualizações

### VH-024 — Configuração avançada de arenas e percurso

- Labels sugeridas: `feature-requested`, `area:arena`, `priority:p1`
- Fonte: `Valhalla` atual + plugin OBR
- Status atual: parcial
- Descrição:
  Evoluir o cadastro de arenas para refletir melhor os elementos do percurso e apoiar tanto pontuação quanto planejamento operacional.
- Valor:
  centraliza informações que hoje ficam espalhadas entre score, rounds e organização.
- Critérios de aceite:
  cada arena pode armazenar configuração relevante do percurso
  esses dados podem ser reutilizados por scheduling e score

### VH-025 — Secretaria operacional completa

- Labels sugeridas: `feature-requested`, `area:secretariat`, `priority:p1`
- Fonte: necessidades OBR e lacunas do legado
- Status atual: parcial
- Descrição:
  Consolidar uma dashboard de secretaria para check-in, conferência de cadastro, filtros por categoria, acompanhamento de prontidão e suporte à operação.
- Valor:
  hoje grande parte da organização depende de telas dispersas.
- Critérios de aceite:
  secretaria consegue operar o evento sem precisar navegar por áreas administrativas técnicas
  filtros e ações são voltados ao dia de competição

### VH-026 — Help center e manual operacional no sistema

- Labels sugeridas: `feature-requested`, `area:ux`, `priority:p2`
- Fonte: `ManualOBRTournamenter.pdf`, `obr-home.ejs`
- Status atual: ausente
- Descrição:
  Disponibilizar ajuda contextual e manual operacional dentro do próprio `Valhalla`.
- Valor:
  reduz curva de adoção em regionais e nacionais.
- Critérios de aceite:
  existe um ponto de ajuda acessível
  o conteúdo cobre admin, árbitro e secretaria

### VH-027 — Saúde do sistema e diagnósticos

- Labels sugeridas: `feature-requested`, `area:ops`, `priority:p2`
- Fonte: logs e monitoramento do `TournamenterApp`
- Status atual: ausente
- Descrição:
  Exibir estado do banco, fila de sync, erros recentes e informações úteis de diagnóstico operacional.
- Valor:
  evita troubleshooting cego durante o evento.
- Critérios de aceite:
  erros críticos ficam visíveis para admin
  existe uma área simples de diagnóstico

### VH-028 — Catálogo de regulamentos OBR

- Labels sugeridas: `feature-requested`, `area:rules`, `priority:p1`
- Fonte: prática atual do plugin OBR
- Status atual: ausente
- Descrição:
  Criar uma entidade formal de regulamento/temporada para vincular categorias, fórmulas, colunas e telas de score.
- Valor:
  transforma a manutenção anual em fluxo explícito de produto.
- Critérios de aceite:
  novos regulamentos podem ser cadastrados/selecionados
  categorias e eventos referenciam um regulamento específico

### VH-029 — Testes automatizados das regras oficiais

- Labels sugeridas: `feature-requested`, `area:quality`, `priority:p1`
- Fonte: risco recorrente identificado no legado
- Status atual: ausente
- Descrição:
  Garantir que fórmulas, desempates e campos de score por temporada tenham testes automatizados.
- Valor:
  reduz regressões ao atualizar o regulamento de um ano para outro.
- Critérios de aceite:
  existem cenários de teste por regulamento
  mudanças de regra quebram testes quando incompatíveis

### VH-030 — Painel inicial operacional da OBR

- Labels sugeridas: `feature-requested`, `area:ux`, `priority:p2`
- Fonte: `tournamenter-obr/public/tournamenter-obr/obr-home.ejs`
- Status atual: ausente
- Descrição:
  Criar uma home operacional para o staff com atalhos claros para pontuação, secretaria, rounds, desafio surpresa, sync e ajuda.
- Valor:
  acelera a navegação no dia do evento e reduz erro operacional.
- Critérios de aceite:
  a home apresenta os fluxos críticos da operação
  alertas como atualização de regulamento ou falha de sync podem aparecer ali

## Itens explicitamente fora do roadmap imediato

Estes itens existem no legado, mas não devem virar prioridade agora:

- instalador de extensões em runtime
- gerenciador desktop multi-servidor como produto separado
- grupo/partida/bracket genérico
- page builder genérico tipo slideshow configurável por módulo

Se algum desses itens voltar à pauta, deve abrir issue específica de descoberta, não implementação direta.
