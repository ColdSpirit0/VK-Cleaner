# VK Cleaner

## Что делает

Удаляет информацию о пользователе из вконтакта:
1. Удаляет записи со стены
1. Снимает лайки
1. Удаляет комментарии
1. Очищает видео
1. Очищает музыку
1. Снимает отметки на фото
1. Выходит из групп

## Важно знать

### По работе скрипта:

* Удалить данные из закрытых групп, к которым нет доступа; удаленных постов и т.п. - на данный момент невозможно в принципе, даже через техподдержку.

* Автор не гарантирует полную очистку данных - возможно некоторые данные придется дочищать вручную. По крайней мере, после первой очистки следует запросить архив данных заново и запустить очистку второй раз.

* Если вк начал заваливать капчами (капча на каждой странице), следует остановить скрипт и продолжить удаление на следующий день. Останавливать скрипт следует закрытием браузера - в консоли упадет ошибка и прогресс сохранится. При следующем запуске прогресс продолжится со страницы с ошибкой.

* Нужно учесть, что на очищение данных суммарно может уйти более суток.

* Неизвестно, как ведет себя скрипт, если свернуть рабочий браузер. Автор не тестировал данный вариант, можете сделать это сами. Тем не менее рекомендуется следить за выполнением скрипта, хотя бы в пол глаза. Если есть возможность, можно поставить выполнение на второй монитор, а на первом, например, смотреть ютуб. Плюс придется вводить капчи время от времени.


### По проекту:

* Серьезное развитие проекта не планируется, т.к. автору удалять больше нечего, соответственно тестировать код негде. Но пулл реквесты и багрепорты приветствуются, правда тестировать все равно придется вам.

* API не используется (и не будет), т.к. он ужасен - 2000 операций в день это крайне мало. Причем после снятия 3 лайков сразу требуется капча.


## Как пользоваться

### Требования для запуска:

* Должен быть установлен [Node.js](https://nodejs.org/en/download/)

* В проекте используется архив данных вк - запросить его можно [тут](https://vk.com/data_protection?section=rules&scroll_to_archive=1), рекомендуется поставить все галочки. На сбор данных может уйти несколько дней, поэтому следует позаботиться об этом заранее.

* Установить браузер [Chrome](https://www.google.com/chrome/). Желательно отключить браузеру автоматические обновления на время удаления данных.

* Скачать [Selenium Chrome Driver](https://googlechromelabs.github.io/chrome-for-testing/#stable) для вашей версии хрома. Распаковать его в директорию, допустим `C://SeleniumDrivers`. Добавить директорию в PATH ([видео](https://www.youtube.com/watch?v=mqIgUbpSz_A)).


### Порядок действий:

1. Склонировать проект

1. Выполнить `npm install` в терминале, в директории проекта

1. Скопировать распакованный архив данных в директорию проекта. Полный путь к файлу `index.html` из архива должен выглядеть так: `<путь_к_проекту>/Archive/index.html`

1. Запустить скрипт командой в терминале `npm start`

1. Если запускаете в первый раз - войти в профиль в открывшемся браузере

1. Когда вк запросит капчу - нужно ее ввести вручную

Если нужно завершить работу (например, выключить ПК на ночь) - закройте браузер и подождите. В терминале отобразится ошибка, и сообщение о том, что данные сохранены, после этого можно завершать работу.

Все данные о работе будут сохранены в директорию reports.

### Параметры командной строки

- `-v`, `--verbose` для вывода отладочной информации.
- `-m`, `--manual` для управления браузером вручную, как обычным.
- `-t`, `--tasks` для указания, какие задачи выполнять. Возможные значения: DeleteWall, DeleteLikes, DeleteComments, DeleteVideos, DeleteMusic, DeletePhotoTags, ExitGroups. Когда эта опция включена, прогресс не сохраняется.

Пример запуска:
```
npm run start -- -t DeleteWall DeleteLikes
```

## Поддержка

Если проект вам помог, то вы можете [поддержать автора](https://github.com/ColdSpirit0/ColdSpirit0/blob/main/donate.md).
