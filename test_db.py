#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.dirname(__file__))

try:
    from models import db, Conversation, ConversationMessage
    from flask import Flask
    from config import Config
    
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    
    with app.app_context():
        print("✅ 成功导入模型")
        
        # 检查表是否存在
        try:
            # 尝试查询，如果表不存在会报错
            conversations = Conversation.query.limit(1).all()
            messages = ConversationMessage.query.limit(1).all()
            print("✅ Conversation和ConversationMessage表都存在")
            print(f"📊 现有对话数量: {Conversation.query.count()}")
            print(f"📊 现有消息数量: {ConversationMessage.query.count()}")
        except Exception as e:
            print(f"❌ 数据库表问题: {e}")
            print("🔧 正在创建表...")
            db.create_all()
            print("✅ 表创建完成")
            
except Exception as e:
    print(f"❌ 导入失败: {e}")
    import traceback
    traceback.print_exc() 