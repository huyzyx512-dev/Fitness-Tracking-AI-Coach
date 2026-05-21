import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AskCoachTab } from '@/pages/ai/components/AskCoachTab'
import { GeneratePlanTab } from '@/pages/ai/components/GeneratePlanTab'
import { HistoryTab } from '@/pages/ai/components/HistoryTab'

type AiCoachTab = 'ask' | 'generate' | 'history'

const TABS: { id: AiCoachTab; label: string }[] = [
  { id: 'ask',       label: 'Ask Coach' },
  { id: 'generate',  label: 'Generate Plan' },
  { id: 'history',   label: 'History' },
]

export default function AiCoachPage() {
  const [activeTab, setActiveTab] = useState<AiCoachTab>('ask')

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
          ) : activeTab === 'generate' ? (
            <div role="tabpanel" aria-label="Generate Plan">
              <GeneratePlanTab />
            </div>
          ) : (
            <div role="tabpanel" aria-label="History">
              <HistoryTab />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
