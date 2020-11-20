from typing import Optional, NewType

Selector = NewType("Selector", str)


def ImageBoxes() -> Selector:
  return Selector(".image-grid .image-box")


def ImageBoxWithTitle(title: str) -> Selector:
  return Selector(f".image-grid .image-box .title:contains('{title}')")


def SelectedImageBox(rotation: Optional[int] = None,
                     label: Optional[str] = None,
                     rating: Optional[int] = None) -> Selector:
  rotation_str = ""
  if rotation is not None:
    rotation_str = f".rotation-{rotation}"

  label_str = ""
  if label is not None:
    label_str = f":has(.has-text-label-{label})"

  rating_str = ""
  if rating is not None:
    if rating > 0:
      rating_str = f":has(.rate-item.set-on:eq({rating - 1})):has(:not(.rate-item.set-on:eq({rating})))"
    else:
      rating_str = ":has(:not(.rate-item.set-on))"

  return Selector(f".image-grid .image-box.selected{rotation_str}{label_str}{rating_str}")


def SelectedImageBoxTitle() -> Selector:
  return Selector(".image-grid .image-box.selected .title")


def LabelFilterRadioButton(label: str,
                           items_count: Optional[int] = None,
                           checked: Optional[bool] = None) -> Selector:
  items_count_str = ""
  if items_count is not None:
    items_count_str = f" [{items_count}]"

  checked_str = ""
  if checked is not None:
    if checked:
      checked_str = " input:checked ~ "
    else:
      checked_str = " input:not(:checked) ~ "
  return Selector(
      f".labels > .row:contains('{label.capitalize()}{items_count_str}'){checked_str} .check")


def PathFilterRadioButton(path: str) -> Selector:
  return Selector(f".paths .row:contains('{path}') label")


def ModePanel(title: str, is_active: Optional[bool] = None) -> Selector:
  active_str = ""
  if is_active is not None:
    if is_active:
      active_str = ".is-active"
    else:
      active_str = ":not(.is-active)"

  return Selector(f".mode-panel li{active_str}:contains('{title}')")


def StatusBarWithText(text: str) -> Selector:
  return Selector(f".status-bar:contains('{text}')")
