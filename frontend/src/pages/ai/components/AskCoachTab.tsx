import { useState, type FormEvent } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAskCoach } from '@/hooks/ai/useAskCoach'
import { getAiFriendlyErrorMessage } from '@/lib/aiError'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Textarea } from '@/components/ui/Textarea'

const MAX_MESSAGE_LENGTH = 2000

export function AskCoachTab() {
  const [message, setMessage] = useState('')
  const [includeProfile, setIncludeProfile] = useState(false)
  const [includeWorkoutHistory, setIncludeWorkoutHistory] = useState(false)

  const askCoach = useAskCoach()

  const trimmedMessage = message.trim()
  const isTooLong = message.length > MAX_MESSAGE_LENGTH
  const isMessageInvalid = trimmedMessage.length === 0 || isTooLong
  const isSubmitting = askCoach.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isMessageInvalid || isSubmitting) return

    askCoach.mutate({
      message: trimmedMessage,
      context: {
        includeProfile,
        includeWorkoutHistory,
      },
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted leading-relaxed rounded-xl border border-border/60 bg-surface/40 px-4 py-3">
        AI chỉ hỗ trợ thông tin tập luyện chung, không thay thế tư vấn y tế.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Textarea
          label="Câu hỏi của bạn"
          placeholder="Ví dụ: Tôi mới bắt đầu tập gym thì nên tập mấy buổi một tuần?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={5}
          disabled={isSubmitting}
          error={isTooLong ? `Tối đa ${MAX_MESSAGE_LENGTH} ký tự` : undefined}
          helperText={`${message.length}/${MAX_MESSAGE_LENGTH}`}
        />

        <div className="space-y-3">
          <Checkbox
            label="Dùng thông tin hồ sơ của tôi"
            checked={includeProfile}
            onChange={(e) => setIncludeProfile(e.target.checked)}
            disabled={isSubmitting}
          />
          <Checkbox
            label="Dùng lịch sử tập luyện gần đây"
            checked={includeWorkoutHistory}
            onChange={(e) => setIncludeWorkoutHistory(e.target.checked)}
            disabled={isSubmitting}
          />
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isMessageInvalid}
        >
          {isSubmitting ? 'AI đang phân tích...' : 'Hỏi AI'}
        </Button>
      </form>

      {askCoach.isError && (
        <Card className="border-danger/40 bg-danger-bg/20">
          <CardBody>
            <div className="flex gap-3 items-start">
              <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm text-danger" role="alert">
                {getAiFriendlyErrorMessage(askCoach.error)}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {askCoach.isSuccess && askCoach.data?.answer != null && (
        <Card>
          <CardHeader className="pb-3 mb-0 border-b-0">
            <CardTitle>Câu trả lời từ AI Coach</CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {askCoach.data.answer}
            </p>
            {askCoach.data.usage?.totalTokens != null && (
              <p className="text-xs text-muted mt-4">
                Tokens: {askCoach.data.usage.totalTokens}
                {askCoach.data.usage.inputTokens != null && askCoach.data.usage.outputTokens != null && (
                  <> ({askCoach.data.usage.inputTokens} in / {askCoach.data.usage.outputTokens} out)</>
                )}
              </p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
