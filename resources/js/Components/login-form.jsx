import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import  logo1  from "../src/logo1.png"
import  logo2  from "../src/logo2.png"
import ePims from "../src/ePIMS.png"
export function LoginForm({data,
  setData,
  submit,
  processing,
  errors,
  canResetPassword,
  status,
  className,
  ...props
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={submit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your ePIMS account
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  required
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={data.password}
                  onChange={(e) => setData("password", e.target.value)}
                  required
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.remember}
                    onChange={(e) => setData("remember", e.target.checked)}
                    className="accent-indigo-600 rounded"
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                {canResetPassword && (
                  <a href={route("password.request")} className="hover:underline">
                    Forgot password?
                  </a>
                )}
              </div>
              <Button type="submit" className="w-full bg-blue-950 hover:bg-blue-800">
                Login
              </Button>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="#" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src={ePims}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
          </div>
        </CardContent>
      </Card>
      <div
        className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}