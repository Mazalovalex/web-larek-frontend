# Проектная работа "Веб-ларек"

_Интернет-магазин на HTML/SCSS/TS по шаблону MVP_

## Технологии

- HTML, SCSS
- TypeScript
- Webpack
- MVP-подход (Model–View–Presenter)

Структура проекта:

- src/ — исходные файлы проекта
- src/components/ — папка с JS компонентами
- src/components/base/ — папка с базовым кодом

Важные файлы:

- src/pages/index.html — HTML-файл главной страницы
- src/types/index.ts — файл с типами
- src/index.ts — точка входа приложения
- src/scss/styles.scss — корневой файл стилей
- src/utils/constants.ts — файл с константами
- src/utils/utils.ts — файл с утилитами

## Базовый код

### 1. Класс Api.

Набор базовых запросов к серверу. Конструктор использует 2 передаваемых аргумента - основная часть ссылки для запроса и настройки. В контрукторе полю baseUrl определяет значние первого аргумента. Настройки используются как один из заголовков запроса внутри защищенного поля options, если они не были переданы в конструктор, используется пустой объект:

```
constructor(baseUrl: string, options: RequestInit = {}) {
    this.baseUrl = baseUrl;
    this.options = {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers as object ?? {})
        }
    };
}
```

Методы:

- handleResponse получает как аргумент ответ запрос, проверяет и возвращает json запроса или ошибку,
- get принимает как агрумент uri, делает get запрос по получившимуся адресу, запускает проверку запроса,
- post принимает как агрумент uri, данные и метод, делает запрос указынный в аргументе метода по получившимуся адресу, передает телу запроса данные в формате json, запускает проверку запроса.

### 2. Класс EventEmitter.

Позволяет подписываться на события и уведомлять подписчиков
о наступлении события. Аргументов у конструктора нет. Значение поля events определяется как пустой массив поля которых имена событий, а значение пустая коллекция из уникальных подписчиков на соответствующее событие:

```
constructor() {
    this._events = new Map<EventName, Set<Subscriber>>();
}
```

Методы класса:

- on получает как агрумент название и обработчик, установливает обработчик на событие,
- off получает как агрумент название и обработчик, снимает обработчик с события,
- emit получает как агрумент название и данные, инициирует событие, передает данные, если были ранее получены,
- onAll получает как агрумент обработчик, отслеживает всех события,
- offAll аргументов не получает, сбросывает все события,
- trigger получает как агрумент название и контекст, создает триггер, генерирующий событие при вызове.

### 3. Класс Model<T>.

Базовая модель, чтобы можно было отличить ее от простых объектов с данными. Конструктор использует как аргументы интерфейс и функционал для работы с событиями. Полей у класса нет. Объединяет текущую модель с интерфейсом:

```
constructor(data: Partial<T>, protected events: IEvents) {
    Object.assign(this, data);
}
```

Методы класса:

- emitChanges получает как агрумент название и данные, чтобы сообщить всем что модель поменялась, используя данные при наличии.

### 4. Класс Component<T>.

Базовый класс для компонентов представления. Дает широкий функционал для работы с HTML элементами. Конструктор использует как аргументы HTML элемент, использующийся только для чтения:

```
protected constructor(protected readonly container: HTMLElement) {
    }
```

Методы класса:

- toggleClass получает как агрумент HTML элемент, название класса и условие, для переключения классов,
- setText получает как агрумент HTML элемент и текст, для изменения текста элемента,
- setDisabled получает как агрумент HTML элемент и условие, для изменения работоспособености,
- setHidden получает как агрумент HTML элемент, скрывает элемент,
- setVisible получает как агрумент HTML элемент, показывает элемент,
- setImage получает как агрумент HTML элемент, ссылку на фото и описание, установливает фото и альтернативное описание,
- render возвращает корневой DOM-элемент.

### 5. Класс Modal.

Основной класс для создания модальных окон. Наследует класс Component<T>. Работает в соответствии с интерфейсом IModalData. Конструктор использует как аргументы HTML элемент и функционал для работы с событиями. Определяет поле closeButton, как кнопку внутри модального окна, а поле content, как элемент внутри модального окна, где должен быть контент. Вешает слушатели закрытия модального окна на кнопку закрытия и пространство на экране, кроме контента:

```
constructor(container: HTMLElement, protected events: IEvents) {
    super(container);

    this._closeButton = ensureElement<HTMLButtonElement>('.modal__close', container);
    this._content = ensureElement<HTMLElement>('.modal__content', container);

    this._closeButton.addEventListener('click', this.close.bind(this));
    this.container.addEventListener('click', this.close.bind(this));
    this._content.addEventListener('click', (event) => event.stopPropagation());
}
```

В классе присутствует сеттер контента.

Методы класса:

- open делает модальное окно активным и создает событие modal:open,
- close делает модальное окно неактивным, отчищает контент и создает событие modal:close,
- render объединяет класс модального окна с его интерфейсом, вызывает метод открытия окна, возвращает получившийся DOM-элемент.

### 6. Класс Form.

Основной класс для создания форм. Наследует класс Component<T>. Работает в соответствии с интерфейсом IFormState. Конструктор использует как аргументы HTML элемент и функционал для работы с событиями. Определяет поле submit, как кнопку кнопку отправки внутри формы, а поле errors, как элемент внутри формы, где будут сообщения об ошибках. Вешает слушатель ввода на форму и создает событие. Вешает слушатель отправки формы, отключает стандартное поведение и создает событие:

```
constructor(protected container: HTMLFormElement, protected events: IEvents) {
    super(container);

    this._submit = ensureElement<HTMLButtonElement>('button[type=submit]', this.container);
    this._errors = ensureElement<HTMLElement>('.form__errors', this.container);

    this.container.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const field = target.name as keyof T;
        const value = target.value;
        this.onInputChange(field, value);
    });

    this.container.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        this.events.emit(`${this.container.name}:submit`);
    });
}
```

В классе присутствуют сеттеры ошибки и валидности формы.

Методы класса:

- onInputChange получает как агрумент название поля ввода и данные, создает событие, где название зависит от названия поля ввода, а также в событие передаются данные в формате: название поля и данные ввода,
- render объединяет класс модального окна с его интерфейсом, возвращает получившийся DOM-элемент.

## Класс ShopAPI

Клас для работы с апи сервера интернет магазина. Наследует класс Api. Работает в соответствии с интерфейсом IShopAPI. Конструктор использует аргументы cdn, основная часть ссылки для запроса и настройки. Основная часть ссылки для запроса и настройки передаются в родитеский класс, а аргумент cdn определяет значение поля cdn:

```
constructor(cdn: string, baseUrl: string, options?: RequestInit) {
    super(baseUrl, options);
    this.cdn = cdn;
}
```

Методы класса:

- getProductList делает get запрос по uri - /product, возвращает список товаров,
- orderProducts получает как агрумент заказ, делает post запрос по uri - /order, отправляет заказ на сервер.

## Модели данных

### 1. Класс Product.

Класс для описания товара, который переиспользуется в каталоге, превью и корзине. Наследует класс Model<T>. Работает в соответствии с интерфейсом IProduct. Содержит поля для хранения данных о товаре:

```
class Product extends Model<IProduct> {
    description: string; // описание товара
    id: string; // айди
    image: string; // ссылка на картинку
    title: string; // название товара
    category: string; // категория
    price: number | null; // цена
    index: number; // индекс в корзине
}
```

### 2. Класс ShopModel.

Описывает всю бизнес-логику интернет магазина. Наследует класс Model<T>. Работает в соответствии с интерфейсом IFormState. Содержит поля для хранения данных хранящихся на странице:

```
class ShopModel extends Model<IShop> {
    basket: string[] = []; // список айди товаров находящихся в корзине
    catalog: Product[]; // список всех товаров
    order: IOrder = { // данные заказа
        payment: '', // способ оплаты
        address: '', // адрес
        email: '', // почта
        phone: '', // номер телефона
        total: 0, // сумма заказа
        items: [] // список айди заказанных товаров
    };
    formErrors: FormErrors = {}; // список ошибок формы
}
```

Методы:

- toggleOrdered получает как агрумент айди товара и действие, в зависимости от действия, либо добавляет, либо удаляет товар из корзины, создает событие basket:changed,
- clearBasket отчщает корзину, создает событие basket:changed,
- clearOrder отчищает данные заказа,
- getTotal находит товары из корзины по айди в каталоге, возвращает сумму товаров в корзине,
- setCatalog получает как агрумент список товаров, передает значение аргумента в поле catalog, создет событие items:render,
- setOrderField получает как агрумент название поля формы и значение этого поля, вносит в соответствующее поле заказа в модели значение второго аргумента и запускает валидацию,
- validateOrder проверяет данные заказа, формирует список ошибок, создает событие formErrors:change, возвращает булевое значение результата валидации.

## Представления

### 1. Класс Basket.

Класс для отображения корзины с товарами, итоговой суммы, кнопки оформления заказа. Наследует класс Component<T>. Работает в соответствии с интерфейсом IBasketView. Конструктор использует как аргументы HTML элемент и функционал для работы с событиями. Определяет поле list, как контейнер списка для элментов корзины, поле total, как элемент отображающий сумму всех товаров в корзине, кнопку button, как кнопку для оформления заказа. Вешает слушатель клика на кнопку и создает событие order:open. Передает полю items пустой массив:

```
constructor(container: HTMLElement, protected events: EventEmitter) {
    super(container);

    this._list = ensureElement<HTMLElement>('.basket__list', this.container);
    this._total = ensureElement<HTMLElement>('.basket__price', this.container);
    this._button = ensureElement<HTMLButtonElement>('.basket__button', this.container);

    this._button.addEventListener('click', () => {
            events.emit('order:open');
    });

    this.items = [];
}
```

В классе присутствуют сеттеры списка элементов корзины и итоговой суммы предметов в корзине. Сеттер total также изменяет работоспособность кнопки оформления заказа: если сумма 0 - кнопка не активна, если больше 0 - активна.

### 2. Класс Success.

Класс для отображения успешной покупки. Наследует класс Component<T>. Работает в соответствии с интерфейсом ISuccess. Конструктор использует как аргументы HTML элемент и действие. Определяет поле total, как элемент отображающий сумму заказанных товаров, кнопку close, как кнопку внутри контента оформленной покупки. Вешает слушатель клика на кнопку:

```
constructor(container: HTMLElement, actions: ISuccessActions) {
    super(container);

    this._close = ensureElement<HTMLElement>('.order-success__close', this.container);
    this._total = ensureElement<HTMLButtonElement>('.order-success__description', this.container);

    if (actions?.onClick) {
        this._close.addEventListener('click', actions.onClick);
    }
}
```

В классе присутствует сеттер итоговой суммы купленных товаров.

### 3. Класс Order.

Класс для отображения первой формы заказа с возможностью выбора способа оплаты и ввода адреса. Наследует класс Form<T>. Работает в соответствии с интерфейсом IOrderForm. Конструктор использует как аргументы HTML элемент и функционал для работы с событиями. Определяет кнопки online и offline, как кнопки выбора способа оплаты, поле address, как поле ввода формы. Вешает слушатель клика на обе кнопки:

```
constructor(container: HTMLFormElement, events: IEvents) {
    super(container, events);

    this._online = this.container.elements.namedItem('online') as HTMLButtonElement;
    this._offline = this.container.elements.namedItem('offline') as HTMLButtonElement;
    this._address = this.container.elements.namedItem('address') as HTMLInputElement;

    this._online.addEventListener('click', () => this.events.emit('order.payment:change', {field: 'payment', value: 'онлайн'}));
    this._offline.addEventListener('click', () => this.events.emit('order.payment:change', {field: 'payment', value: 'офлайн'}));
}
```

В классе присутствуют сеттеры адреса и способа оплаты. Сеттер способа оплаты также изменяет стили для кнопок, чтобы активен был выбранный способ оплаты.

### 4. Класс Contacts.

Класс для отображения второй формы заказа с двумя полями ввода. Наследует класс Form<T>. Работает в соответствии с интерфейсом IContactsForm. Конструктор использует как аргументы HTML элемент и функционал для работы с событиями. Определяет поля phone и email, как поля ввода формы:

```
constructor(container: HTMLFormElement, events: IEvents) {
    super(container, events);

    this._phone = this.container.elements.namedItem('phone') as HTMLInputElement;
    this._email = this.container.elements.namedItem('email') as HTMLInputElement;
}
```

В классе присутствуют сеттеры номера телефона и почты.

### 5. Класс Card<T>.

Класс для отображения карточки товара в каталоге, превью и корзине. Наследует класс Component<T>. Работает в соответствии с интерфейсом ICard<T>. Конструктор использует как аргументы HTML элемент и действие. Определяет поля title, description, category, price как текстовые поля описываютщие товар, поле image, как место для картинки, index, как индекс элемент в корзине, кнопку button, как кнопку действия с товаром. Вешает слушатель клика на кнопку, если ее нет, то на всю карточку товара:

```
constructor(container: HTMLElement, actions?: ICardActions) {
    super(container);

    this._title = ensureElement<HTMLElement>(`.card__title`, container);
    this._image = container.querySelector(`.card__image`);
    this._button = container.querySelector(`.card__button`);
    this._description = container.querySelector(`.card__description`);
    this._price = ensureElement<HTMLElement>(`.card__price`, container);
    this._category = container.querySelector(`.card__category`);
    this._index = container.querySelector(`.basket__item-index`);

    if (actions?.onClick) {
        if (this._button) {
            this._button.addEventListener('click', actions.onClick);
        } else {
            container.addEventListener('click', actions.onClick);
        }
    }
}
```

В классе присутствуют сеттеры айди, названия товара, картинки, описания, категории, цены, индекса и кнопки. Сеттер айди передает его как значение датасета карточки товара. Сеттер категории также меняет цвет HTML элемента, где она находится. Сетер цены также устанавливает значение "Бесценно" и делает неактивным кнопку добавления в корзину. Сеттер кнопки устанавливает текст кнопки.

### 6. Класс Page.

Класс для отображения всей страницы с каталогом, кнопки корзины и счетчика товаров. Наследует класс Component<T>. Работает в соответствии с интерфейсом IPage. Конструктор использует как аргументы HTML элемент и действие. Определяет поле counter, как счетчик товаров в корзине, поле catalog, как контейнер списка для элментов каталога на странице, wrapper, как обертка всей страницы, basket, как кнопка для открытия модального окна корзины. Вешает слушатель клика на кнопку корзины и создает событие basket:open:

```
constructor(container: HTMLElement, protected events: IEvents) {
    super(container);

    this._counter = ensureElement<HTMLElement>('.header__basket-counter');
    this._catalog = ensureElement<HTMLElement>('.gallery');
    this._wrapper = ensureElement<HTMLElement>('.page__wrapper');
    this._basket = ensureElement<HTMLButtonElement>('.header__basket');

    this._basket.addEventListener('click', () => {
        this.events.emit('basket:open');
    });
}
```

В классе присутствуют сеттеры счетчика товаров в корзине, каталога и блокировка страницы. Сеттер блокировка запрещает или разрешает прокрутку страницы в зависимости от переданного значения.

## Презентер

Код презентера не выделен в отдельный класс, а размещен в основном скрипте приложения.
