# integration-interface-ai Specification

## Purpose
Gatherer-based contracts and consumer services for AI features: contributing page context, requesting completions and listing available agents. Providers (e.g. an AI provider remote component) register gatherers; consumers use the services.

## Requirements

### Requirement: AI context gatherer
`AiContextGatherer` SHALL be a `Gatherer` named `aiContext` version 1 with request `AiContextRequest` (`agent.name`) and response `AiContextResponse | null` (`productName`, `appId`, `appPath`, `context`). A callback returning `null` SHALL mean the application does not contribute.

#### Scenario: Opt out
- **WHEN** the callback returns `null`
- **THEN** that application contributes no context

### Requirement: AI completion gatherer
`AiCompletionGatherer` SHALL be a `Gatherer` named `aiCompletion` version 1 with request `AiCompletionRequest` (`agent {id,name}`, `aiContext: string[]`, `message`, `systemPrompt`) and response `AiCompletionResponse | null` (`message`).

#### Scenario: Provider answers
- **WHEN** a provider callback returns `{ message }`
- **THEN** the gather result contains it

### Requirement: AI agent gatherer
`AiAgentGatherer` SHALL be a `Gatherer` named `aiAgent` version 1 with request `AiAgentRequest` (optional `appId`) and response `AiAgentResponse[] | null` (`id`, `name`, optional `description`, `languageCode`, `voiceEnabled`, `appId`). It SHALL pass the provided callback through unchanged.

#### Scenario: Registered name
- **WHEN** `new AiAgentGatherer(cb)` is created
- **THEN** it is registered as `aiAgent` version 1 with `cb`

### Requirement: Completion service
`OneCXAiCompletionService.getCompletion(request)` SHALL forward the request unchanged to its `AiCompletionGatherer` and return the first non-null response. It SHALL throw `Error('No AI provider responded to the completion request')` when no response or only null responses are gathered. The service's own gatherer callback (`consumerAiCompletionProvider`) SHALL always return `null`. `destroy()` SHALL destroy the gatherer.

#### Scenario: First non-null wins
- **WHEN** responses are `[null, A, B]`
- **THEN** `A` is returned

#### Scenario: No provider
- **WHEN** responses are `[]` or all `null`
- **THEN** the call rejects with `No AI provider responded to the completion request`

### Requirement: Agent service
`OneCXAiAgentService.getAgents(request = {})` SHALL forward the request unchanged to its `AiAgentGatherer`, merge the agent lists of all providers (skipping `null`), de-duplicate by `id` keeping the first occurrence, and return an array. When no agents result it SHALL return an empty list (and log a warning). `consumerAiAgentProvider` SHALL always return `null`. `destroy()` SHALL destroy the gatherer.

#### Scenario: Deduplicate
- **WHEN** two providers return an agent with the same `id`
- **THEN** only the first is returned

#### Scenario: Default request
- **WHEN** `getAgents()` is called without argument
- **THEN** the gatherer receives `{}`

#### Scenario: No providers
- **WHEN** the gatherer returns no responses
- **THEN** an empty array is returned
