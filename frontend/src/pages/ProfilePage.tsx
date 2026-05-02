import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Scale, Calendar, Mail, ShieldCheck } from 'lucide-react'
import { PageHeader }  from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input }       from '@/components/ui/Input'
import { Select }      from '@/components/ui/Select'
import { Button }      from '@/components/ui/Button'
import { Avatar }      from '@/components/ui/Avatar'
import { Badge }       from '@/components/ui/Badge'
import { useAuthStore }   from '@/store/auth.store'
import { useUpdateUser }  from '@/hooks/user/useUpdateUser'
import { GENDER_LABELS }  from '@/lib/constants'

function msg(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

/* Schema mirrors backend updateUserSchema.
   z.union is used for optional number fields so the input type stays
   string | number (not unknown), keeping it compatible with RHF's Resolver. */
const optionalPositiveNumber = (msg: string) =>
  z.union([
    z.literal('').transform(() => undefined),
    z.coerce.number().positive(msg),
  ]).optional()

const schema = z.object({
  name:          z.string().trim().min(3, 'Tên phải có ít nhất 3 ký tự').optional().or(z.literal('')),
  weight:        optionalPositiveNumber('Cân nặng phải lớn hơn 0'),
  height:        optionalPositiveNumber('Chiều cao phải lớn hơn 0'),
  gender:        z.enum(['nam', 'nữ', 'khác'] as const).optional(),
  date_of_birth: z.string().optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined && v !== ''), {
  message: 'Vui lòng cập nhật ít nhất một thông tin',
})

type FormValues = z.infer<typeof schema>

const genderOptions = Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))

export default function ProfilePage() {
  const user         = useAuthStore((s) => s.user)
  const { mutate, isPending } = useUpdateUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:          user?.name ?? '',
      weight:        user?.weight ?? (undefined as unknown as number),
      height:        user?.height ?? (undefined as unknown as number),
      gender:        (user?.gender as 'nam' | 'nữ' | 'khác' | undefined) ?? undefined,
      date_of_birth: user?.date_of_birth?.slice(0, 10) ?? '',
    },
  })

  return (
    <div className="max-w-2xl space-y-6 animate-fade-up">
      <PageHeader title="HỒ SƠ" description="Quản lý thông tin cá nhân" />

      {/* User identity card */}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name ?? user?.email} size="xl" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user?.name ?? '—'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Mail size={13} className="text-muted" />
              <span className="text-sm text-muted">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <ShieldCheck size={13} className="text-muted" />
              <Badge variant="accent">{user?.role?.name ?? 'USER'}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4">
          <Input
            label="Họ và tên"
            leftIcon={<User size={15} />}
            error={msg(errors.name?.message)}
            required
            {...register('name')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cân nặng (kg)"
              type="number"
              step="0.1"
              leftIcon={<Scale size={15} />}
              error={msg(errors.weight?.message)}
              {...register('weight')}
            />
            <Input
              label="Chiều cao (cm)"
              type="number"
              step="0.1"
              error={msg(errors.height?.message)}
              {...register('height')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Giới tính"
              options={genderOptions}
              placeholder="Chọn giới tính"
              error={msg(errors.gender?.message)}
              {...register('gender')}
            />
            <Input
              label="Ngày sinh"
              type="date"
              leftIcon={<Calendar size={15} />}
              error={msg(errors.date_of_birth?.message)}
              {...register('date_of_birth')}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={isPending}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
