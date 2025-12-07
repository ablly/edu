#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.dirname(__file__))

def test_ai_ask_direct():
    """直接测试AI答疑逻辑"""
    try:
        from flask import Flask
        from models import db, Conversation, ConversationMessage
        from config import Config
        from openai import OpenAI
        import uuid
        
        # 创建Flask应用
        app = Flask(__name__)
        app.config.from_object(Config)
        db.init_app(app)
        
        with app.app_context():
            print("🧪 直接测试AI答疑逻辑...")
            
            # 测试数据
            question = "你好，请简单介绍一下Python编程语言？"
            session_id = f"test_{uuid.uuid4()}"
            
            print(f"❓ 问题: {question}")
            print(f"🆔 会话ID: {session_id}")
            
            # 查找或创建会话
            conversation = Conversation.query.filter_by(session_id=session_id).first()
            if not conversation:
                conversation = Conversation(session_id=session_id)
                db.session.add(conversation)
                db.session.flush()  # 获取ID
                
                # 添加系统消息
                system_msg = ConversationMessage(
                    conversation_id=conversation.id,
                    role='system',
                    content="你是一位知识渊博的导师，请用专业但易懂的语言回答学生问题。"
                )
                db.session.add(system_msg)
            
            # 添加用户消息
            user_msg = ConversationMessage(
                conversation_id=conversation.id,
                role='user',
                content=question
            )
            db.session.add(user_msg)
            db.session.flush()
            
            print("✅ 会话和消息已创建")
            
            # 获取对话历史
            messages = [msg.to_dict() for msg in 
                       ConversationMessage.query.filter_by(conversation_id=conversation.id)
                       .order_by(ConversationMessage.created_at).all()]
            
            print(f"📚 对话历史: {len(messages)} 条消息")
            
            # 调用DeepSeek API
            client = OpenAI(
                api_key=app.config['DEEPSEEK_API_KEY'],
                base_url=app.config['DEEPSEEK_BASE_URL']
            )
            
            response = client.chat.completions.create(
                model=app.config['DEEPSEEK_MODEL'],
                messages=messages,
                temperature=0.3,
                max_tokens=1024,
                stream=False
            )
            
            ai_response = response.choices[0].message.content
            print(f"🤖 AI原始回答: {ai_response}")
            
            # 保存AI回复
            ai_msg = ConversationMessage(
                conversation_id=conversation.id,
                role='assistant',
                content=ai_response
            )
            db.session.add(ai_msg)
            db.session.commit()
            
            print("✅ AI答疑测试完成!")
            print(f"✨ 最终答案: {ai_response}")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ai_ask_direct() 