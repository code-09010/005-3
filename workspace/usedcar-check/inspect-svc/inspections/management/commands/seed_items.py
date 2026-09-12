"""种子化 26 个标准检测项。幂等：按 code 判断，已存在则跳过。"""
from django.core.management.base import BaseCommand

from inspections.models import InspectionItem

# (code, 名称, 分组, 权重) —— 权重总和 120，计算时按实际权重归一化
ITEMS = [
    # 动力系统 36
    ("engine", "发动机", "动力系统", 12),
    ("gearbox", "变速箱", "动力系统", 10),
    ("exhaust", "排气系统", "动力系统", 4),
    ("cooling", "冷却系统", "动力系统", 4),
    ("battery", "蓄电池", "动力系统", 3),
    ("clutch", "离合器", "动力系统", 3),
    # 底盘操控 42
    ("chassis", "底盘/车架", "底盘操控", 12),
    ("suspension", "悬挂系统", "底盘操控", 8),
    ("brakes", "制动系统", "底盘操控", 10),
    ("steering", "转向系统", "底盘操控", 6),
    ("tires", "轮胎轮毂", "底盘操控", 4),
    ("four_drive", "四驱系统", "底盘操控", 2),
    # 车身外观 22
    ("paint", "漆面外观", "车身外观", 6),
    ("body_structure", "车身结构/事故", "车身外观", 8),
    ("glass", "车窗玻璃", "车身外观", 2),
    ("lights", "灯光系统", "车身外观", 2),
    ("doors", "车门及密封", "车身外观", 2),
    ("sunroof", "天窗/敞篷", "车身外观", 2),
    # 内饰电子 15
    ("interior", "内饰磨损", "内饰电子", 4),
    ("seats", "座椅功能", "内饰电子", 2),
    ("aircon", "空调系统", "内饰电子", 3),
    ("electronics", "电子仪表", "内饰电子", 3),
    ("infotainment", "影音导航", "内饰电子", 2),
    ("airbag", "安全气囊", "内饰电子", 1),
    # 其他 5
    ("fluids", "油水液", "其他", 2),
    ("test_drive", "路试表现", "其他", 2),
    ("docs", "手续证件", "其他", 1),
]


class Command(BaseCommand):
    help = "初始化标准检测项目录（幂等）"

    def handle(self, *args, **options):
        created = 0
        for sort_order, (code, name, category, weight) in enumerate(ITEMS, start=1):
            _, was_created = InspectionItem.objects.get_or_create(
                code=code,
                defaults={
                    "name": name,
                    "category": category,
                    "weight": weight,
                    "sort_order": sort_order,
                },
            )
            created += int(was_created)
        total = InspectionItem.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"检测项就绪：新增 {created} 项，共 {total} 项"
            )
        )
