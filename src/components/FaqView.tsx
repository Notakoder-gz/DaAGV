import React, { useState } from 'react';
import { HelpCircle, BookOpen, Layers, Move, Paintbrush, MapPin, GitCommitHorizontal, Square, Cpu, Wifi, Code } from 'lucide-react';

export const FaqView: React.FC = () => {
  const [activeCategory, setActiveSubCategory] = useState<string>('overview');

  const faqItems = [
    {
      id: 'overview',
      title: '1. Обзор системы и координатных сеток (SLAM & Traffic)',
      icon: <BookOpen className="w-4 h-4 text-blue-400" />,
      content: (
        <div className="space-y-3 text-slate-300 leading-relaxed text-xs">
          <p>
            Приложение предназначено для комплексного визуального редактирования растровых карт занятости SLAM (Occupancy Grid) и векторов трафика (бизнес-графов движения роботов AMR/AGV).
          </p>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
            <h4 className="font-bold text-white">Координатные пространства:</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Растровый слой (Pixels):</strong> Координаты (0,0) в верхнем левом углу базового изображения карты.</li>
              <li><strong className="text-slate-200">Мировой слой SLAM (Meters):</strong> Метрические координаты ROS с учетом `resolution` (м/пикс) и `origin` (мировые координаты нижней левой точки карты).</li>
              <li><strong className="text-slate-200">Слой Трафика / Графа (Millimeters):</strong> Нативные координаты сайта/точек в миллиметрах (мм) с учетом смещений `project_info.json` (`map_origin_offset_x`, `map_origin_offset_y`, `map_origin_offset_theta`).</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'import_export',
      title: '2. Импорт папки проекта и экспорт файлов',
      icon: <Layers className="w-4 h-4 text-amber-400" />,
      content: (
        <div className="space-y-3 text-slate-300 leading-relaxed text-xs">
          <p>
            Вы можете загрузить всю папку проекта целиком или выбрать отдельные файлы:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong className="text-slate-200">Load Folder:</strong> Загружает сразу все файлы проекта (`map.json`, `project_info.json`, `new_map.png` и все файлы из поддиректории `traffic_map/*.json`).</li>
            <li><strong className="text-slate-200">Multi-Traffic Map Selector:</strong> Переключатель в левой панели позволяет мгновенно выбирать активный граф движения, если в проекте несколько бизнес-карт.</li>
            <li><strong className="text-slate-200">Export Map & Traffic Files:</strong> Скачивает синхронизированные файлы обратно со всеми выровненными смещениями и отредактированными пикселями.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'alignment',
      title: '3. Выравнивание карты SLAM и Графа (Map Alignment)',
      icon: <Move className="w-4 h-4 text-emerald-400" />,
      content: (
        <div className="space-y-3 text-slate-300 leading-relaxed text-xs">
          <p>
            Инструмент <strong className="text-emerald-400">Map Alignment</strong> позволяет точно совместить базовую растровую карту со слоем графа движения:
          </p>
          <p className="text-slate-400">
            При изменении смещения `Offset X (мм)`, `Offset Y (мм)` или поворота `Theta (град)` приложение автоматически пересчитывает координаты в `project_info.json` и генерацию файла ориентации ROS `.yaml`, гарантируя точную локализацию робота.
          </p>
        </div>
      ),
    },
    {
      id: 'editing_tools',
      title: '4. Инструменты рисования и очистки карты (Paint & Clear)',
      icon: <Paintbrush className="w-4 h-4 text-pink-400" />,
      content: (
        <div className="space-y-3 text-slate-300 leading-relaxed text-xs">
          <p>
            Редактирование растра производится прямо на пиксельном холсте:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong className="text-slate-200">Paint Wall (Black):</strong> Рисует непроходимые стены (значение 0 / черный пиксель).</li>
            <li><strong className="text-slate-200">Clear Area (White):</strong> Очищает динамические помехи и шумы датчиков (значение 255 / белый свободный пиксель).</li>
            <li><strong className="text-slate-200">Brush Size:</strong> Регулировка диаметра кисти от 2 до 50 пикселей.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'node_edge_zones',
      title: '5. Узлы, Направленные Дуги, Кривые Безье и Зоны',
      icon: <GitCommitHorizontal className="w-4 h-4 text-purple-400" />,
      content: (
        <div className="space-y-3 text-slate-300 leading-relaxed text-xs">
          <ul className="list-disc list-inside space-y-2 text-slate-400">
            <li><strong className="text-slate-200">Add Node/Site (Узлы):</strong> Добавление путевых точек с настройкой угла остановки (`stop_dir`), типа ухода в коллизию, включением фотодатчиков вил и типа точки (1=Waypoint, 3=Charger, 6=Spin, 7=Pallet Pickup).</li>
            <li><strong className="text-slate-200">Add Edge/Path (Сегменты):</strong> Соединение узлов линиями движения. Поддерживаются кривые Безье (Type 2) с фиолетовыми интерактивными маркерами изгиба траектории.</li>
            <li><strong className="text-slate-200">Draw Polygon Zone (Зоны):</strong> Рисование произвольных полигонов для зон запрета проезда (Keep-Out), ограничения скорости и погрузочных зон.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'vda5050',
      title: '6. Вкладка VDA 5050 Command Center & Split Mode',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      content: (
        <div className="space-y-3 text-slate-300 leading-relaxed text-xs">
          <p>
            Командная станция протокола VDA 5050 v2.0:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400">
            <li><strong className="text-slate-200">Split Map & VDA Mode:</strong> Раздельный экран с картой. Клик по узлу на карте автоматически добавляет его в последовательность ордера.</li>
            <li><strong className="text-slate-200">Editable JSON Payload:</strong> Живой редактор JSON массива с подсветкой и валидацией синтаксиса.</li>
            <li><strong className="text-slate-200">MQTT Broker Settings:</strong> Подключение к брокеру MQTT с топиками `order`, `instantActions` (eStop, Pause, Charge, Cancel) и мотором логов `state`.</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-1 h-full bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Left Index Sidebar */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 p-4 space-y-2 overflow-y-auto">
        <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm mb-4">
          <HelpCircle className="w-5 h-5" />
          <span>FAQ & Справочное руководство</span>
        </div>

        {faqItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubCategory(item.id)}
            className={`w-full text-left p-3 rounded-lg border font-medium text-xs flex items-center space-x-2.5 transition-colors ${
              activeCategory === item.id
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span className="truncate">{item.title}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
        <div className="max-w-3xl mx-auto bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          {faqItems.find((i) => i.id === activeCategory)?.content}
        </div>
      </div>
    </div>
  );
};
