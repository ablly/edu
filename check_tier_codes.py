from app import app, db
from models_membership import MembershipTier

with app.app_context():
    tiers = MembershipTier.query.all()
    print('会员套餐列表:')
    for t in tiers:
        print(f'ID: {t.id}, Code: {t.code}, Name: {t.name}')


