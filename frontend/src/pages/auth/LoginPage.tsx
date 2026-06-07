import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLogin } from "@/hooks/auth/useLogin";
import { ROUTES } from "@/lib/constants";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const location = useLocation();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const from = (location.state as { from?: { pathname: string } })?.from
    ?.pathname;

  function onSubmit(values: FormValues) {
    login.mutate(values, {
      onSuccess: () => {
        /* redirect handled inside hook, override with `from` if present */
        if (from) window.history.replaceState(null, "", from);
      },
    });
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground">
          Chào mừng trở lại
        </h2>
        <p className="text-sm text-muted mt-1">
          Đăng nhập để tiếp tục luyện tập
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          required
          {...register("email")}
        />

        <Input
          label="Mật khẩu"
          type={showPass ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="text-muted hover:text-foreground transition-colors p-0.5"
              aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={errors.password?.message}
          required
          {...register("password")}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          loading={login.isPending}
          size="lg"
        >
          Đăng nhập
        </Button>
      </form>

      <p className="text-sm text-center text-muted mt-6">
        Chưa có tài khoản?{" "}
        <Link
          to={ROUTES.REGISTER}
          className="text-accent hover:text-accent-light font-medium transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
