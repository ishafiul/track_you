'use client'
import { authApi } from "@/api";
import { localStorageService } from "http-client-local";
import { useMutation } from "@tanstack/react-query"
import { Button, Form, Input, message, Typography } from 'antd';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

type EmailFormValues = {
  email: string;
};

type OtpFormValues = {
  email: string;
  otp: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm<OtpFormValues>();
  const [otpSent, setOtpSent] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Device UUID mutation
  const deviceUuidMutation = useMutation({
    mutationFn: authApi.createDeviceUuid,
    onSuccess: (data) => {
      localStorageService.setDeviceUuid(data.deviceUuid)
    },
    onError: (error) => {
      messageApi.error('Failed to initialize device');
    }
  });

  // Request OTP mutation
  const requestOtpMutation = useMutation({
    mutationFn: authApi.requestOtp,
    onSuccess: () => {
      setOtpSent(true);
      messageApi.success('OTP sent successfully');
    },
    onError: (error) => {
      messageApi.error('Failed to send OTP');
    }
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (data) => {
      messageApi.success('Login successful');
      localStorageService.setAccessToken(data.accessToken);
      // Handle tokens here
      router.push('/'); // Redirect to dashboard
    },
    onError: (error) => {
      messageApi.error('Invalid OTP');
    }
  });

  useEffect(() => {
    deviceUuidMutation.mutate();
  }, []);

  const handleEmailSubmit = (values: EmailFormValues) => {
    requestOtpMutation.mutate({
      email: values.email,
      deviceUuid: localStorageService.getDeviceUuid() || ''
    });
  };

  const handleOtpSubmit = (values: OtpFormValues) => {
    verifyOtpMutation.mutate({
      email: values.email,
      otp: parseInt(values.otp),
      deviceUuid: localStorageService.getDeviceUuid() || ''
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      {contextHolder}
      <div className="w-full max-w-md p-8">
        <Title level={2} className="text-center mb-8">Login</Title>
        
        <Form<OtpFormValues>
          form={form}
          layout="vertical"
          onFinish={otpSent ? handleOtpSubmit : handleEmailSubmit}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              size="large"
              placeholder="Enter your email"
              disabled={otpSent}
            />
          </Form.Item>

          {otpSent && (
            <Form.Item
              name="otp"
              label="OTP"
              rules={[
                { required: true, message: 'Please input the OTP!' },
                { pattern: /^\d{5}$/, message: 'OTP must be 5 digits!' }
              ]}
            >
              <Input 
                size="large"
                placeholder="Enter 5-digit OTP"
                maxLength={5}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={requestOtpMutation.isPending || verifyOtpMutation.isPending}
              block
            >
              {otpSent ? 'Verify OTP' : 'Send OTP'}
            </Button>
          </Form.Item>
        </Form>

        {deviceUuidMutation.isPending && (
          <Text type="secondary" className="text-center block">
            Initializing...
          </Text>
        )}
      </div>
    </div>
  );
}
