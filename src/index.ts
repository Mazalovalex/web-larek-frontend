import './scss/styles.scss';

import { IProduct } from './types';
import { API_URL, CDN_URL } from './utils/constants';
import { ShopAPI } from './components/ShopAPI';
import { EventEmitter } from './components/base/events';
import { ShopModel } from './components/ShopModel';
import { Page } from './components/Page';
import { Card } from './components/Card';
import { cloneTemplate, ensureElement } from './utils/utils';
import { Modal } from './components/common/Modal';
import { Basket } from './components/common/Basket';
import { IOrder, IOrderForm, IContactsForm, IForm } from './types';
import { Order, Contacts } from './components/Order';
import { Success } from './components/common/Success';

// Создаём объект для обмена событиями между частями приложения
const events = new EventEmitter();

// Подключаем API для работы с товарами и заказами
const api = new ShopAPI(CDN_URL, API_URL);

// Чтобы видеть все события в консоли — удобно при отладке
events.onAll(({ eventName, data }) => {
	console.log(eventName, data);
});

// Берём шаблоны из HTML, чтобы потом клонировать и создавать карточки и формы
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

// Создаём модель магазина — в ней будут данные и логика
const shop = new ShopModel({}, events);

// Контейнеры для страницы и модального окна
const page = new Page(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);

// Создаём основные компоненты: корзина, формы заказа, контактов и успешного завершения
const basket = new Basket(cloneTemplate(basketTemplate), events);
const order = new Order(cloneTemplate(orderTemplate), events);
const contacts = new Contacts(cloneTemplate(contactsTemplate), events);
const success = new Success(cloneTemplate(successTemplate), {
	// Когда пользователь закроет окно успеха — закрываем модалку
	onClick: () => {
		modal.close();
	},
});

// Загружаем товары с сервера и сохраняем их в магазин
api
	.getProductList()
	.then(shop.setCatalog.bind(shop))
	.catch((err) => console.error(err));

// Когда нужно показать список товаров, создаём карточки для каждого товара
events.on<IProduct[]>('items:render', () => {
	page.catalog = shop.catalog.map((item) => {
		const card = new Card(cloneTemplate(cardCatalogTemplate), {
			// При клике на карточку товара — отправляем событие выбора товара
			onClick: () => events.emit('card:select', item),
		});
		card.id = item.id;

		// Создаём и возвращаем готовую карточку с нужными данными
		return card.render({
			title: item.title,
			image: item.image,
			price: item.price,
			category: item.category,
		});
	});
});

// Когда выбрали товар, показываем его подробно в модальном окне
events.on('card:select', (item: IProduct) => {
	const card = new Card(cloneTemplate(cardPreviewTemplate), {
		onClick: () => {
			// Закрываем модалку и добавляем или убираем товар из корзины
			modal.close();
			shop.toggleOrdered(
				item.id,
				shop.basket.includes(item.id) ? 'Remove' : 'Add'
			);
		},
	});

	// Кнопка меняется в зависимости от того, есть ли товар в корзине
	card.button = shop.basket.includes(item.id) ? 'Убрать' : 'Купить';

	// Показываем карточку товара в модальном окне
	modal.render({
		content: card.render({
			title: item.title,
			image: item.image,
			price: item.price,
			category: item.category,
			description: item.description,
		}),
	});
});

// Когда корзина изменилась (товар добавлен или убран), обновляем интерфейс
events.on('basket:changed', () => {
	// Показываем количество товаров в корзине на странице
	page.counter = shop.basket.length;

	// Для каждого товара в корзине создаём карточку с кнопкой удаления
	basket.items = shop.basket.map((id, index) => {
		const item = shop.catalog.find((item) => item.id === id);

		const card = new Card(cloneTemplate(cardBasketTemplate), {
			onClick: () => shop.toggleOrdered(item.id, 'Remove'),
		});

		return card.render({
			index: index + 1,
			title: item.title,
			price: item.price,
		});
	});

	// Обновляем общую сумму корзины
	basket.total = shop.getTotal();
});

// Когда пользователь хочет открыть корзину, показываем её содержимое в модалке
events.on('basket:open', () => {
	modal.render({
		content: basket.render(),
	});
});

// Когда открываем форму заказа, очищаем предыдущие данные и показываем форму
events.on('order:open', () => {
	shop.clearOrder();
	modal.render({
		content: order.render({
			payment: '',
			address: '',
			valid: false,
			errors: [],
		}),
	});
});

// После заполнения первой формы переходим к форме с контактами
events.on('order:submit', () => {
	modal.render({
		content: contacts.render({
			phone: '',
			email: '',
			valid: false,
			errors: [],
		}),
	});
});

// Открываем форму с контактами (может быть и из других мест)
events.on('contacts:open', () => {
	modal.render({
		content: contacts.render({
			phone: '',
			email: '',
			valid: false,
			errors: [],
		}),
	});
});

// Когда меняется что-то в первой форме, обновляем данные заказа в модели
events.on(
	/^order\..*:change/,
	(data: { field: keyof IOrderForm; value: string }) => {
		shop.setOrderField(data.field, data.value);
	}
);

// Аналогично, когда меняется что-то во второй форме — обновляем модель
events.on(
	/^contacts\..*:change/,
	(data: { field: keyof IContactsForm; value: string }) => {
		shop.setOrderField(data.field, data.value);
	}
);

// Обновляем формы на экране, когда изменились данные заказа
events.on('order:changed', (orderData: IOrder) => {
	order.render({
		payment: orderData.payment,
		address: orderData.address,
		// Проверяем, нет ли ошибок для оплаты и адреса
		valid: !shop.formErrors.payment && !shop.formErrors.address,
		errors: [shop.formErrors.payment, shop.formErrors.address].filter(Boolean),
	});

	contacts.render({
		email: orderData.email,
		phone: orderData.phone,
		// Проверяем ошибки для телефона и email
		valid: !shop.formErrors.email && !shop.formErrors.phone,
		errors: [shop.formErrors.email, shop.formErrors.phone].filter(Boolean),
	});
});

// Обновляем ошибки и валидность в формах, если появились новые ошибки
events.on('formErrors:change', (errors: Partial<IForm>) => {
	const { payment, address, phone, email } = errors;

	// Для формы заказа
	order.valid = !payment && !address;
	order.errors = Object.values({ payment, address }).filter(Boolean).join('; ');

	// Для формы контактов
	contacts.valid = !phone && !email;
	contacts.errors = Object.values({ phone, email }).filter(Boolean).join('; ');
});

// Когда отправляем заказ с контактами — посылаем данные на сервер
events.on('contacts:submit', () => {
	api
		.orderProducts({
			...shop.order,
			items: shop.basket,
			total: shop.getTotal(),
		})
		.then(() => {
			// Если всё успешно — показываем сообщение и очищаем корзину
			modal.render({
				content: success.render({
					total: shop.getTotal(),
				}),
			});
			shop.clearBasket();
		})
		.catch((err) => {
			console.error(err);
		});
});

// При открытии модалки блокируем прокрутку страницы, чтобы не смещалась страница
events.on('modal:open', () => {
	page.locked = true;
});

// При закрытии модалки снова разрешаем прокрутку
events.on('modal:close', () => {
	page.locked = false;
});
