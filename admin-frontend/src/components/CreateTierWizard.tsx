/**
 * 创建会员套餐向导 - 全新设计
 * 采用分步骤表单，确保用户体验流畅
 */

import React, { useState } from 'react';
import {
  Modal,
  Steps,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Tag,
  message,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  // DeleteOutlined, // 暂时注释掉未使用的导入
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMembershipTier } from '../api/memberships';
import './CreateTierWizard.css';

const { TextArea } = Input;

interface CreateTierWizardProps {
  visible: boolean;
  onClose: () => void;
}

const CreateTierWizard: React.FC<CreateTierWizardProps> = ({ visible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  
  // 保存所有步骤的表单数据
  const [formData, setFormData] = useState<any>({});

  // 创建套餐mutation
  const createMutation = useMutation({
    mutationFn: createMembershipTier,
    onSuccess: () => {
      message.success('套餐创建成功！');
      queryClient.invalidateQueries({ queryKey: ['membership-tiers'] });
      handleClose();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '创建失败，请重试');
    },
  });

  // 关闭并重置
  const handleClose = () => {
    form.resetFields();
    setCurrentStep(0);
    setFeatures([]);
    setFeatureInput('');
    setFormData({});
    onClose();
  };

  // 下一步
  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        const values = await form.validateFields(['name', 'code', 'description']);
        setFormData({ ...formData, ...values });
      } else if (currentStep === 1) {
        const values = await form.validateFields(['price', 'duration_days', 'is_limited', 'total_quota', 'is_early_bird', 'original_price', 'early_bird_tier']);
        setFormData({ ...formData, ...values });
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 添加功能
  const handleAddFeature = () => {
    console.log('点击添加功能，当前输入:', featureInput);
    if (featureInput.trim()) {
      const newFeatures = [...features, featureInput.trim()];
      setFeatures(newFeatures);
      setFeatureInput('');
      console.log('功能已添加，当前功能列表:', newFeatures);
    } else {
      message.warning('请输入功能描述');
    }
  };

  // 删除功能
  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // 提交创建
  const handleSubmit = async () => {
    try {
      if (features.length === 0) {
        message.warning('请至少添加一个套餐功能');
        return;
      }

      // 获取第3步的表单值
      const step3Values = await form.validateFields(['is_active']);
      
      // 合并所有步骤的数据
      const finalData = { ...formData, ...step3Values };
      
      const payload = {
        name: finalData.name,
        code: finalData.code,
        description: finalData.description,
        price: Number(finalData.price),
        duration_days: Number(finalData.duration_days || 30),
        features,
        level: 0,
        is_active: finalData.is_active ?? true,
        is_limited: finalData.is_limited ?? false,
        is_early_bird: finalData.is_early_bird ?? false,
        total_quota: Number(finalData.total_quota) || 0,
        early_bird_tier: Number(finalData.early_bird_tier) || 0,
        original_price: Number(finalData.original_price) || 0,
        sort_order: 0,
        permissions: {
          ai_qa_daily_limit: 100,
          ai_question_daily_limit: 50,
          ai_lecture_daily_limit: 20,
          video_summary_daily_limit: 10,
          programming_assist_daily_limit: 30,
        }, // 添加缺失的字段
        currency: 'CNY', // 添加缺失的字段
      };

      createMutation.mutate(payload);
    } catch (error) {
      console.error('提交失败:', error);
      message.error('请完成所有必填项');
    }
  };

  // 步骤配置
  const stepItems = [
    { title: '基本信息' },
    { title: '价格设置' },
    { title: '套餐功能' },
  ];
  const steps = [
    {
      title: '基本信息',
      content: (
        <div className="step-content">
          <Form.Item
            name="name"
            label="套餐名称"
            rules={[{ required: true, message: '请输入套餐名称' }]}
          >
            <Input 
              size="large" 
              placeholder="例如：月度会员" 
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="套餐代码"
            rules={[
              { required: true, message: '请输入套餐代码' },
              { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线' }
            ]}
          >
            <Input 
              size="large" 
              placeholder="例如：monthly" 
              maxLength={20}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="套餐描述"
            rules={[{ required: true, message: '请输入套餐描述' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请简要描述套餐内容和特点" 
              maxLength={200}
              showCount
            />
          </Form.Item>
        </div>
      ),
    },
    {
      title: '价格设置',
      content: (
        <div className="step-content">
          <Form.Item
            name="price"
            label="套餐价格（元）"
            rules={[{ required: true, message: '请输入套餐价格' }]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="请输入价格"
              prefix="¥"
            />
          </Form.Item>

          <Form.Item
            name="duration_days"
            label="有效期（天）"
            rules={[{ required: true, message: '请输入有效期' }]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              min={1}
              placeholder="例如：30"
            />
          </Form.Item>

          <Divider>高级设置（可选）</Divider>

          <Form.Item name="is_limited" label="是否限量" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="total_quota" label="总名额（限量时有效）">
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              min={0}
              placeholder="0表示无限"
            />
          </Form.Item>

          <Form.Item name="is_early_bird" label="是否早鸟优惠" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="original_price" label="原价（早鸟时显示）">
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="用于显示优惠幅度"
              prefix="¥"
            />
          </Form.Item>

          <Form.Item name="early_bird_tier" label="早鸟档位">
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              min={0}
              max={3}
              placeholder="1/2/3"
            />
          </Form.Item>
        </div>
      ),
    },
    {
      title: '套餐功能',
      content: (
        <div className="step-content">
          <div className="feature-input-group">
            <Input
              size="large"
              placeholder="输入功能描述，例如：AI智能答疑"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onPressEnter={handleAddFeature}
              maxLength={50}
            />
            <Button 
              type="primary" 
              size="large"
              icon={<PlusOutlined />} 
              onClick={handleAddFeature}
            >
              添加
            </Button>
          </div>

          <div className="features-list">
            {features.length === 0 ? (
              <div className="empty-features">
                <p>还没有添加任何功能</p>
                <p>请至少添加一个功能</p>
              </div>
            ) : (
              features.map((feature, index) => (
                <Tag
                  key={index}
                  className="feature-tag"
                  closable
                  onClose={() => handleRemoveFeature(index)}
                  icon={<CheckCircleOutlined />}
                >
                  {feature}
                </Tag>
              ))
            )}
          </div>

          <Form.Item name="is_active" label="创建后立即启用" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="创建新套餐"
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={null}
      className="create-tier-wizard"
    >
      <Steps current={currentStep} items={stepItems} className="wizard-steps" />

      <Form
        form={form}
        layout="vertical"
        className="wizard-form"
        initialValues={{
          duration_days: 30,
          price: 0,
          sort_order: 0,
          is_active: true,
          is_limited: false,
          is_early_bird: false,
          total_quota: 0,
          early_bird_tier: 0,
          original_price: 0,
        }}
      >
        <div className="step-container">
          {steps[currentStep].content}
        </div>
      </Form>

      <div className="wizard-actions">
        <Space>
          {currentStep > 0 && (
            <Button size="large" onClick={handlePrev}>
              上一步
            </Button>
          )}
          <Button onClick={handleClose} size="large">
            取消
          </Button>
          {currentStep < steps.length - 1 && (
            <Button type="primary" size="large" onClick={handleNext}>
              下一步
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button 
              type="primary" 
              size="large"
              onClick={handleSubmit}
              loading={createMutation.isPending}
            >
              创建套餐
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default CreateTierWizard;

