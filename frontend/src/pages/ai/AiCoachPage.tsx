import { useState, type ReactNode } from 'react'
import { CalendarPlus, History, MessageCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AskCoachTab } from '@/pages/ai/components/AskCoachTab'

type AiCoachTab = 'ask' | 'generate' | 'history'

const TABS: { id: AiCoachTab; label: string }[] = [
  { id: 'ask',       label: 'Ask Coach' },
  { id: 'generate',  label: 'Generate Plan' },
  { id: 'history',   label: 'History' },
]

const TAB_PLACEHOLDERS: Record<
  AiCoachTab,
  { title: string; description: string; icon: ReactNode }
> = {
  ask: {
    title: 'Ask Coach',
    description: 'Tab hỏi đáp AI sẽ được triển khai ở Stage 10.',
    icon: <MessageCircle size={28} />,
  },
  generate: {
    title: 'Generate Plan',
    description: 'Tab tạo kế hoạch tập luyện sẽ được triển khai ở Stage 11.',
    icon: <CalendarPlus size={28} />,
  },
  history: {
    title: 'History',
    description: 'Tab lịch sử recommendation sẽ được triển khai ở Stage 12.',
    icon: <History size={28} />,
  },
}

export default function AiCoachPage() {
  const [activeTab, setActiveTab] = useState<AiCoachTab>('ask')
  const placeholder =
    activeTab === 'generate' || activeTab === 'history'
      ? TAB_PLACEHOLDERS[activeTab]
      : null

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="AI COACH"
        description="Tạo lịch tập bằng AI, hỏi đáp về tập luyện và xem lại các plan đã sinh."
      />

      <Card>
        <CardBody>
          <div
            role="tablist"
            aria-label="AI Coach sections"
            className="flex flex-wrap gap-2"
          >
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                variant={activeTab === tab.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {activeTab === 'ask' ? (
            <div role="tabpanel" aria-label="Ask Coach">
              <AskCoachTab />
            </div>
          ) : placeholder ? (
            <div role="tabpanel" aria-label={placeholder.title}>
              <EmptyState
                icon={placeholder.icon}
                title={placeholder.title}
                description={placeholder.description}
              />
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}
