"use client";

import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { message } from 'antd';
import { Eye, EyeOff, Phone, ShieldCheck, Sparkles, UserRoundPlus, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import api from '@/api/http';
import { useLanguage } from '@/i18n';
import type { AuthUser, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AnimatedCharactersLoginPageProps {
  onAuthSuccess: (token: string, user: AuthUser) => Promise<void>;
}

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

type AuthMode = 'login' | 'register';
type RegisterRole = Exclude<UserRole, 'admin'>;

type RegisterFormState = {
  nickname: string;
  phone: string;
  password: string;
  role: RegisterRole;
  realName: string;
  serviceArea: string;
  skillDesc: string;
};

const demoAccounts = [
  { key: 'customer', role: '客户', phone: '13800000000', password: 'demo123', icon: Phone },
  { key: 'engineer', role: '工程师', phone: '13900000000', password: 'demo123', icon: Wrench },
  { key: 'admin', role: '管理员', phone: '13700000000', password: 'admin123', icon: ShieldCheck }
] as const;

function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 20);
}

function getDefaultPathByRole(role: UserRole) {
  switch (role) {
    case 'engineer':
      return '/engineer';
    case 'admin':
      return '/admin';
    case 'customer':
    default:
      return '/user';
  }
}

const Pupil = ({ size = 12, maxDistance = 5, pupilColor = 'black', forceLookX, forceLookY }: PupilProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) {
      return { x: 0, y: 0 };
    }

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;
    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    />
  );
};

const EyeBall = ({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = 'white',
  pupilColor = 'black',
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) {
      return { x: 0, y: 0 };
    }

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;
    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="flex items-center justify-center rounded-full transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden'
      }}
    >
      {!isBlinking ? (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      ) : null}
    </div>
  );
};

function AnimatedCharactersLoginPage({ onAuthSuccess }: AnimatedCharactersLoginPageProps) {
  const navigate = useNavigate();
  const { t, tx } = useLanguage();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    nickname: '',
    phone: '',
    password: '',
    role: 'customer',
    realName: '',
    serviceArea: '',
    skillDesc: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  const activePassword = authMode === 'login' ? loginPassword : registerForm.password;
  const activePasswordVisible = authMode === 'login' ? showLoginPassword : showRegisterPassword;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const blinkTimeout = window.setTimeout(() => {
        setIsPurpleBlinking(true);
        window.setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);
      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const blinkTimeout = window.setTimeout(() => {
        setIsBlackBlinking(true);
        window.setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);
      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isTyping) {
      setIsLookingAtEachOther(false);
      return undefined;
    }

    setIsLookingAtEachOther(true);
    const timer = window.setTimeout(() => {
      setIsLookingAtEachOther(false);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [isTyping]);

  useEffect(() => {
    setIsTyping(false);
    setIsLookingAtEachOther(false);
    setIsPurplePeeking(false);
  }, [authMode]);

  useEffect(() => {
    if (!(activePassword.length > 0 && activePasswordVisible)) {
      setIsPurplePeeking(false);
      return undefined;
    }

    const peekTimeout = window.setTimeout(() => {
      setIsPurplePeeking(true);
      const resetTimeout = window.setTimeout(() => {
        setIsPurplePeeking(false);
      }, 800);
      return () => window.clearTimeout(resetTimeout);
    }, Math.random() * 3000 + 2000);

    return () => window.clearTimeout(peekTimeout);
  }, [activePassword, activePasswordVisible, isPurplePeeking]);

  const calculatePosition = (ref: RefObject<HTMLDivElement>) => {
    if (!ref.current) {
      return { faceX: 0, faceY: 0, bodySkew: 0 };
    }

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120))
    };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const resetError = () => setError('');

  const fillDemoAccount = (roleKey: (typeof demoAccounts)[number]['key']) => {
    const demo = demoAccounts.find((item) => item.key === roleKey);
    if (!demo) {
      return;
    }

    setAuthMode('login');
    setLoginPhone(demo.phone);
    setLoginPassword(demo.password);
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    resetError();
  };

  const updateRegisterForm = <K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) => {
    setRegisterForm((current) => ({ ...current, [key]: value }));
    resetError();
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetError();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        phone: normalizePhoneInput(loginPhone),
        password: loginPassword
      });
      const { token, user } = response.data.data as { token: string; user: AuthUser };
      await onAuthSuccess(token, user);
      message.success(tx('登录成功', 'Signed in successfully'));
      navigate(getDefaultPathByRole(user.role));
    } catch (authError: unknown) {
      const errorMessage =
        typeof authError === 'object' && authError !== null && 'response' in authError
          ? (authError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const nextError = (errorMessage && t(errorMessage)) || tx('登录失败', 'Sign-in failed');
      setError(nextError);
      message.error(nextError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetError();

    if (registerForm.role === 'engineer' && (!registerForm.realName.trim() || !registerForm.serviceArea.trim() || !registerForm.skillDesc.trim())) {
      const nextError = tx('请完整填写工程师资料。', 'Please complete the engineer profile fields.');
      setError(nextError);
      message.error(nextError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        nickname: registerForm.nickname.trim(),
        phone: normalizePhoneInput(registerForm.phone),
        password: registerForm.password,
        role: registerForm.role,
        realName: registerForm.realName.trim(),
        serviceArea: registerForm.serviceArea.trim(),
        skillDesc: registerForm.skillDesc.trim()
      });
      const { token, user } = response.data.data as { token: string; user: AuthUser };
      await onAuthSuccess(token, user);
      message.success(tx('注册成功，已自动登录', 'Registration successful. You are now signed in automatically.'));
      navigate(getDefaultPathByRole(user.role));
    } catch (authError: unknown) {
      const errorMessage =
        typeof authError === 'object' && authError !== null && 'response' in authError
          ? (authError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const nextError = (errorMessage && t(errorMessage)) || tx('注册失败', 'Registration failed');
      setError(nextError);
      message.error(nextError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-190px)] overflow-hidden rounded-[32px] border border-white/60 bg-background shadow-[0_30px_80px_rgba(15,23,42,0.08)] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/90 via-[#5b3df5] to-[#1f2937] p-12 text-primary-foreground lg:flex">
        <div className="relative z-20">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
              <Sparkles className="size-4" />
            </div>
            <span>{tx('修达达 Repair+', 'Repair+ / 修达达')}</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/80">
            {tx('登录后即可按身份进入客户、工程师或管理员工作台。左边这几位小家伙会帮你盯着输入框，基本不会让你输错——至少它们是这么自信的。', 'Sign in to jump straight into the customer, engineer, or admin workspace. The little crew on the left keeps an eye on your inputs—perhaps with more confidence than accuracy.')}
          </p>
        </div>

        <div className="relative z-20 flex h-[500px] items-end justify-center">
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            <div
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '70px',
                width: '180px',
                height: isTyping || (activePassword.length > 0 && !activePasswordVisible) ? '440px' : '400px',
                backgroundColor: '#6C3FF5',
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transform:
                  activePassword.length > 0 && activePasswordVisible
                    ? 'skewX(0deg)'
                    : isTyping || (activePassword.length > 0 && !activePasswordVisible)
                      ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                      : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center'
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: activePassword.length > 0 && activePasswordVisible ? '20px' : isLookingAtEachOther ? '55px' : `${45 + purplePos.faceX}px`,
                  top: activePassword.length > 0 && activePasswordVisible ? '35px' : isLookingAtEachOther ? '65px' : `${40 + purplePos.faceY}px`
                }}
              >
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isPurpleBlinking}
                  forceLookX={activePassword.length > 0 && activePasswordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={activePassword.length > 0 && activePasswordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isPurpleBlinking}
                  forceLookX={activePassword.length > 0 && activePasswordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={activePassword.length > 0 && activePasswordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>
            </div>

            <div
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '240px',
                width: '120px',
                height: '310px',
                backgroundColor: '#2D2D2D',
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transform:
                  activePassword.length > 0 && activePasswordVisible
                    ? 'skewX(0deg)'
                    : isLookingAtEachOther
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                      : isTyping || (activePassword.length > 0 && !activePasswordVisible)
                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                        : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center'
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left: activePassword.length > 0 && activePasswordVisible ? '10px' : isLookingAtEachOther ? '32px' : `${26 + blackPos.faceX}px`,
                  top: activePassword.length > 0 && activePasswordVisible ? '28px' : isLookingAtEachOther ? '12px' : `${32 + blackPos.faceY}px`
                }}
              >
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isBlackBlinking}
                  forceLookX={activePassword.length > 0 && activePasswordVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={activePassword.length > 0 && activePasswordVisible ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isBlackBlinking}
                  forceLookX={activePassword.length > 0 && activePasswordVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={activePassword.length > 0 && activePasswordVisible ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>
            </div>

            <div
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '0px',
                width: '240px',
                height: '200px',
                zIndex: 3,
                backgroundColor: '#FF9B6B',
                borderRadius: '120px 120px 0 0',
                transform: activePassword.length > 0 && activePasswordVisible ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center'
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left: activePassword.length > 0 && activePasswordVisible ? '50px' : `${82 + (orangePos.faceX || 0)}px`,
                  top: activePassword.length > 0 && activePasswordVisible ? '85px' : `${90 + (orangePos.faceY || 0)}px`
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={activePassword.length > 0 && activePasswordVisible ? -5 : undefined} forceLookY={activePassword.length > 0 && activePasswordVisible ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={activePassword.length > 0 && activePasswordVisible ? -5 : undefined} forceLookY={activePassword.length > 0 && activePasswordVisible ? -4 : undefined} />
              </div>
            </div>

            <div
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '310px',
                width: '140px',
                height: '230px',
                backgroundColor: '#E8D754',
                borderRadius: '70px 70px 0 0',
                zIndex: 4,
                transform: activePassword.length > 0 && activePasswordVisible ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center'
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left: activePassword.length > 0 && activePasswordVisible ? '20px' : `${52 + (yellowPos.faceX || 0)}px`,
                  top: activePassword.length > 0 && activePasswordVisible ? '35px' : `${40 + (yellowPos.faceY || 0)}px`
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={activePassword.length > 0 && activePasswordVisible ? -5 : undefined} forceLookY={activePassword.length > 0 && activePasswordVisible ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={activePassword.length > 0 && activePasswordVisible ? -5 : undefined} forceLookY={activePassword.length > 0 && activePasswordVisible ? -4 : undefined} />
              </div>
              <div
                className="absolute h-[4px] w-20 rounded-full bg-[#2D2D2D] transition-all duration-200 ease-out"
                style={{
                  left: activePassword.length > 0 && activePasswordVisible ? '10px' : `${40 + (yellowPos.faceX || 0)}px`,
                  top: activePassword.length > 0 && activePasswordVisible ? '88px' : `${88 + (yellowPos.faceY || 0)}px`
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-primary-foreground/70">
          <button type="button" onClick={() => navigate('/')} className="transition-colors hover:text-primary-foreground">
            {tx('首页', 'Home')}
          </button>
          <button type="button" onClick={() => navigate('/services')} className="transition-colors hover:text-primary-foreground">
            {tx('服务列表', 'Services')}
          </button>
          <button type="button" onClick={() => navigate('/engineer')} className="transition-colors hover:text-primary-foreground">
            {tx('工程师端', 'Engineer console')}
          </button>
        </div>

        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
        <div className="absolute right-1/4 top-1/4 size-64 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 rounded-full bg-primary-foreground/5 blur-3xl" />
      </div>

      <div className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-[460px]">
          <div className="mb-10 flex items-center justify-center gap-2 text-lg font-semibold lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <span>{tx('修达达 Repair+', 'Repair+ / 修达达')}</span>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setShowLoginPassword(false);
                setShowRegisterPassword(false);
                resetError();
              }}
              className={cn(
                'rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                authMode === 'login' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tx('登录', 'Sign in')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setShowLoginPassword(false);
                setShowRegisterPassword(false);
                resetError();
              }}
              className={cn(
                'rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                authMode === 'register' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tx('注册', 'Register')}
            </button>
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
              {authMode === 'login' ? tx('欢迎回来！', 'Welcome back!') : tx('创建你的维修平台账号', 'Create your repair account')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {authMode === 'login'
                ? tx('请输入手机号与密码，系统会按你的身份打开对应工作台。', 'Enter your phone number and password. The platform will open the workspace that matches your role.')
                : tx('客户和工程师都可以在这里注册；管理员账号仍由演示账号登录。', 'Both customers and engineers can register here; administrator access still uses the demo account.')}
            </p>
          </div>

          {authMode === 'login' ? (
            <form key="login-form" onSubmit={handleLoginSubmit} className="space-y-5" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="login-phone">{tx('手机号', 'Phone number')}</Label>
                <Input
                  id="login-phone"
                  name="loginPhone"
                  type="tel"
                  placeholder={tx('例如：13800000000', 'Example: 13800000000')}
                  value={loginPhone}
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={20}
                  spellCheck={false}
                  onChange={(event) => {
                    setLoginPhone(normalizePhoneInput(event.target.value));
                    resetError();
                  }}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  className="h-12 border-border/60 bg-background focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">{tx('密码', 'Password')}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="loginPassword"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    autoComplete="current-password"
                    onChange={(event) => {
                      setLoginPassword(event.target.value);
                      resetError();
                    }}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    required
                    className="h-12 border-border/60 bg-background pr-10 focus-visible:ring-primary"
                  />
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowLoginPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showLoginPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                  <Label htmlFor="remember" className="cursor-pointer font-normal">
                    {tx('记住本设备偏好', 'Remember this device preference')}
                  </Label>
                </div>
                <span className="text-sm font-medium text-primary">
                  {tx('支持客户 / 工程师 / 管理员登录', 'Customer / engineer / admin login supported')}
                </span>
              </div>

              {error ? <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-3 text-sm text-red-400">{error}</div> : null}

              <Button type="submit" className="h-12 w-full text-base font-medium" size="lg" disabled={isLoading}>
                {isLoading ? tx('登录中...', 'Signing in...') : tx('登录', 'Sign in')}
              </Button>
            </form>
          ) : (
            <form key="register-form" onSubmit={handleRegisterSubmit} className="space-y-5" autoComplete="on">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="register-nickname">{tx('昵称', 'Nickname')}</Label>
                  <Input
                    id="register-nickname"
                    name="registerNickname"
                    type="text"
                    placeholder={tx('请输入昵称', 'Enter your nickname')}
                    value={registerForm.nickname}
                    autoComplete="nickname"
                    autoCorrect="off"
                    spellCheck={false}
                    onChange={(event) => updateRegisterForm('nickname', event.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    required
                    className="h-12 border-border/60 bg-background focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone">{tx('手机号', 'Phone number')}</Label>
                  <Input
                    id="register-phone"
                    name="registerPhone"
                    type="tel"
                    placeholder={tx('请输入手机号', 'Enter your phone number')}
                    value={registerForm.phone}
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={20}
                    spellCheck={false}
                    onChange={(event) => updateRegisterForm('phone', normalizePhoneInput(event.target.value))}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    required
                    className="h-12 border-border/60 bg-background focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">{tx('密码', 'Password')}</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      name="registerPassword"
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder={tx('至少 6 位密码', 'At least 6 characters')}
                      value={registerForm.password}
                      autoComplete="new-password"
                      onChange={(event) => updateRegisterForm('password', event.target.value)}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      minLength={6}
                      required
                      className="h-12 border-border/60 bg-background pr-10 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setShowRegisterPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showRegisterPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{tx('注册身份', 'Register as')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: 'customer', title: tx('客户', 'Customer'), description: tx('下单与查看订单', 'Place and track orders') },
                    { key: 'engineer', title: tx('工程师', 'Engineer'), description: tx('接单与处理服务', 'Accept and complete jobs') }
                  ] as const).map((roleOption) => (
                    <button
                      key={roleOption.key}
                      type="button"
                      onClick={() => updateRegisterForm('role', roleOption.key)}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition-all',
                        registerForm.role === roleOption.key
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/60 hover:border-primary/50 hover:bg-accent/60'
                      )}
                    >
                      <div className="font-semibold text-foreground">{roleOption.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{roleOption.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {registerForm.role === 'engineer' ? (
                <div className="space-y-5 rounded-2xl border border-border/60 bg-muted/35 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="engineer-name">{tx('真实姓名', 'Full name')}</Label>
                    <Input
                      id="engineer-name"
                      name="engineerRealName"
                      type="text"
                      placeholder={tx('例如：张工', 'Example: Engineer Zhang')}
                      value={registerForm.realName}
                      autoComplete="name"
                      autoCorrect="off"
                      onChange={(event) => updateRegisterForm('realName', event.target.value)}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      required
                      className="h-12 border-border/60 bg-background focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="engineer-area">{tx('服务区域', 'Service area')}</Label>
                    <Input
                      id="engineer-area"
                      name="engineerServiceArea"
                      type="text"
                      placeholder={tx('例如：Sydney CBD / Zetland', 'Example: Sydney CBD / Zetland')}
                      value={registerForm.serviceArea}
                      autoComplete="street-address"
                      autoCorrect="off"
                      onChange={(event) => updateRegisterForm('serviceArea', event.target.value)}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      required
                      className="h-12 border-border/60 bg-background focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="engineer-skill">{tx('技能描述', 'Skill summary')}</Label>
                    <textarea
                      id="engineer-skill"
                      name="engineerSkillDesc"
                      placeholder={tx('例如：擅长手机换屏、主板维修、电池更换', 'Example: Specialised in screen replacement, logic board repair, and battery service')}
                      value={registerForm.skillDesc}
                      autoComplete="off"
                      onChange={(event) => updateRegisterForm('skillDesc', event.target.value)}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      rows={4}
                      className="flex min-h-[112px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      required
                    />
                  </div>
                </div>
              ) : null}

              {error ? <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-3 text-sm text-red-400">{error}</div> : null}

              <Button type="submit" className="h-12 w-full text-base font-medium" size="lg" disabled={isLoading}>
                {isLoading ? tx('注册中...', 'Creating account...') : tx('注册并登录', 'Register and sign in')}
              </Button>
            </form>
          )}

          <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRoundPlus className="size-4 text-primary" />
              {tx('演示账号快速填充', 'Quick demo access')}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <Button
                    key={account.key}
                    variant="outline"
                    type="button"
                    onClick={() => fillDemoAccount(account.key)}
                    className="h-auto min-h-[72px] flex-col items-start justify-start gap-1 border-border/60 px-4 py-3 text-left hover:bg-accent"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="size-4 text-primary" />
                      {t(account.role)}
                    </div>
                    <div className="text-xs text-muted-foreground">{account.phone}</div>
                  </Button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {tx('点击任一按钮会自动填入对应演示账号。管理员账号仅支持登录，不参与公开注册。', 'Click any button to autofill the corresponding demo account. The administrator account is sign-in only and is not part of public registration.')}
            </p>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {authMode === 'login' ? tx('还没有账号？', 'Don’t have an account yet?') : tx('已经有账号了？', 'Already have an account?')}{' '}
            <button
              type="button"
              onClick={() => {
                setAuthMode((current) => (current === 'login' ? 'register' : 'login'));
                setShowLoginPassword(false);
                setShowRegisterPassword(false);
                resetError();
              }}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {authMode === 'login' ? tx('立即注册', 'Create one now') : tx('返回登录', 'Back to sign in')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedCharactersLoginPage };
export default AnimatedCharactersLoginPage;
export const Component = AnimatedCharactersLoginPage;
