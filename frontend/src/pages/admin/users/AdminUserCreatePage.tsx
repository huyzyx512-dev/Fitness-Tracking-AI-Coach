import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, KeyRound, Mail, Shield, User } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ROUTES, ROLE } from '@/lib/constants'
import { useCreateAdminUser } from '@/hooks/user/useCreateAdminUser'
import type { AdminCreateUserPayload } from '@/types/admin-user.types'

const ROLE_OPTIONS = [
  { value: ROLE.USER, label: 'USER' },
  { value: ROLE.COACH, label: 'COACH' },
  { value: ROLE.ADMIN, label: 'ADMIN' },
]

const schema = z.object({
  name: z.string().trim().min(3, 'Tên phải có ít nhất 3 ký tự'),
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.enum([ROLE.ADMIN, ROLE.USER, ROLE.COACH] as const, { message: 'Chọn vai trò' }),
  adminPassword: z
    .string()
    .min(1, 'Nhập mật khẩu tài khoản quản trị để xác nhận'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export default function AdminUserCreatePage() {
  const navigate = useNavigate()
  const createUser = useCreateAdminUser()
  const [showPassword, setShowPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: ROLE.USER,
      adminPassword: '',
    },
  })

  function onSubmit(values: FormValues) {
    const payload: AdminCreateUserPayload = {
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
      adminPassword: values.adminPassword,
    }
    createUser.mutate(payload, {
      onSuccess: (res) => {
        navigate(ROUTES.ADMIN_USER_DETAIL(res.user.id))
      },
    })
  }

  return (
    <section className="space-y-6 animate-fade-up">
      <PageHeader
        title="TẠO NGƯỜI DÙNG"
        description="Tạo tài khoản mới với mật khẩu ban đầu do quản trị đặt. Người dùng có thể đổi mật khẩu sau khi đăng nhập."
        action={
          <Link to={ROUTES.ADMIN_USERS}>
            <Button type="button" variant="outline">
              Quay lại danh sách
            </Button>
          </Link>
        }
      />

      <Card className="p-6 md:p-8 max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            leftIcon={<User size={15} />}
            error={errors.name?.message}
            required
            {...register('name')}
          />

          <Input
            label="Email đăng nhập"
            type="email"
            placeholder="user@example.com"
            autoComplete="off"
            leftIcon={<Mail size={15} />}
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <Input
            label="Mật khẩu ban đầu"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            leftIcon={<KeyRound size={15} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted hover:text-foreground transition-colors p-0.5"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            error={errors.password?.message}
            required
            {...register('password')}
          />

          <Select
            label="Vai trò"
            options={ROLE_OPTIONS}
            error={errors.role?.message}
            required
            {...register('role')}
          />

          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
              Xác thực quản trị
            </p>
            <Input
              label="Mật khẩu tài khoản của bạn"
              type={showAdminPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu để xác nhận hành động"
              autoComplete="current-password"
              leftIcon={<Shield size={15} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowAdminPassword((v) => !v)}
                  className="text-muted hover:text-foreground transition-colors p-0.5"
                  aria-label={showAdminPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showAdminPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              helperText="Giống các thao tác khóa tài khoản hay đổi vai trò: cần nhập lại mật khẩu quản trị."
              error={errors.adminPassword?.message}
              required
              {...register('adminPassword')}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" loading={createUser.isPending}>
              Tạo người dùng
            </Button>
            <Link to={ROUTES.ADMIN_USERS}>
              <Button type="button" variant="secondary" disabled={createUser.isPending}>
                Hủy
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </section>
  )
}
