import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Scale, Ruler, Calendar } from 'lucide-react'
import { Input }    from '@/components/ui/Input'
import { Select }   from '@/components/ui/Select'
import { Button }   from '@/components/ui/Button'
import { useRegister } from '@/hooks/auth/useRegister'
import { ROUTES, GENDER_LABELS } from '@/lib/constants'
import type { RegisterPayload } from '@/types/auth.types'

const registerSchema = z.object({
  name:     z.string().trim().min(3, 'Tên phải có ít nhất 3 ký tự'),
  email:    z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  birthday: z.string().min(1, 'Vui lòng nhập ngày sinh'),
  /* Zod v4: avoid invalid_type_error; keep required numbers in output */
  height:   z.coerce.number({ message: 'Vui lòng nhập chiều cao' })
    .refine((n) => Number.isFinite(n), 'Vui lòng nhập chiều cao')
    .positive('Chiều cao phải lớn hơn 0'),
  weight:   z.coerce.number({ message: 'Vui lòng nhập cân nặng' })
    .refine((n) => Number.isFinite(n), 'Vui lòng nhập cân nặng')
    .positive('Cân nặng phải lớn hơn 0'),
  gender:   z.enum(['male', 'female', 'other'] as const, { message: 'Vui lòng chọn giới tính' }),
})

type FormInput = z.input<typeof registerSchema>
type FormValues = z.output<typeof registerSchema>

const genderOptions = Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(registerSchema) })

  return (
    <div className="animate-fade-up">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Tạo tài khoản</h2>
        <p className="text-sm text-muted mt-1">Bắt đầu hành trình luyện tập của bạn</p>
      </div>

      <form
        onSubmit={handleSubmit((v) => {
          const payload = registerSchema.parse(v) as RegisterPayload
          registerMutation.mutate(payload)
        })}
        noValidate
        className="space-y-4"
      >
        {/* Name */}
        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          leftIcon={<User size={15} />}
          error={errors.name?.message}
          required
          {...register('name')}
        />

        {/* Email */}
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          required
          {...register('email')}
        />

        {/* Password */}
        <Input
          label="Mật khẩu"
          type={showPass ? 'text' : 'password'}
          placeholder="Tối thiểu 6 ký tự"
          autoComplete="new-password"
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="text-muted hover:text-foreground transition-colors p-0.5"
              aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={errors.password?.message}
          required
          {...register('password')}
        />

        {/* Divider */}
        <div className="pt-1">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
            Thông tin thể trạng
          </p>

          {/* Weight + Height */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cân nặng (kg)"
              type="number"
              step="0.1"
              placeholder="70"
              leftIcon={<Scale size={15} />}
              error={errors.weight?.message}
              required
              {...register('weight')}
            />
            <Input
              label="Chiều cao (cm)"
              type="number"
              step="0.1"
              placeholder="170"
              leftIcon={<Ruler size={15} />}
              error={errors.height?.message}
              required
              {...register('height')}
            />
          </div>

          {/* Gender */}
          <div className="mt-3">
            <Select
              label="Giới tính"
              options={genderOptions}
              placeholder="Chọn giới tính"
              error={errors.gender?.message}
              required
              {...register('gender')}
            />
          </div>

          {/* Birthday */}
          <div className="mt-3">
            <Input
              label="Ngày sinh"
              type="date"
              leftIcon={<Calendar size={15} />}
              error={errors.birthday?.message}
              required
              {...register('birthday')}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={registerMutation.isPending}
          size="lg"
        >
          Tạo tài khoản
        </Button>
      </form>

      <p className="text-sm text-center text-muted mt-6">
        Đã có tài khoản?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="text-accent hover:text-accent-light font-medium transition-colors"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
