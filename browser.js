var hyperx = require('hyperx')

var leadingSpaceRegex = /^[\s]+/
var trailingSpaceRegex = /[\s]+$/

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = {
  autofocus: 1,
  checked: 1,
  defaultchecked: 1,
  disabled: 1,
  formnovalidate: 1,
  indeterminate: 1,
  readonly: 1,
  required: 1,
  selected: 1,
  willvalidate: 1
}
var COMMENT_TAG = '!--'
var SVG_TAGS = [
  'svg',
  'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
  'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB',
  'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
  'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'font', 'font-face',
  'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri',
  'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image', 'line',
  'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS[key]) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  function appendChild (childs) {
    if (!Array.isArray(childs)) return
    var hadText = false
    for (var i = 0, len = childs.length; i < len; i++) {
      var node = childs[i]
      if (Array.isArray(node)) {
        appendChild(node)
        continue
      }

      if (typeof node === 'number' ||
        typeof node === 'boolean' ||
        typeof node === 'function' ||
        node instanceof Date ||
        node instanceof RegExp) {
        node = node.toString()
      }

      var lastChild = el.childNodes[el.childNodes.length - 1]
      if (typeof node === 'string') {
        hadText = true
        if (lastChild && lastChild.nodeName === '#text') {
          lastChild.nodeValue += node
        } else {
          node = document.createTextNode(node)
          el.appendChild(node)
          lastChild = node
        }
        // The current text node is the last child of its parent.
        if (i === len - 1 && el.nodeName !== 'PRE') {
          hadText = false
          var value = i === 0
            // If this text node is the first child of its parent and
            // the only child of its parent, trim its leading spaces and
            // trim its trailing spaces.
            ? lastChild.nodeValue.trim()
            // If this text node is the last child of its parent, but
            // not the only child of its parent, collapse its leading
            // spaces and trim its trailing spaces.
            : lastChild.nodeValue
                .replace(leadingSpaceRegex, ' ')
                .replace(trailingSpaceRegex, '')
          if (value !== '') lastChild.nodeValue = value
          else el.removeChild(lastChild)
        }
      } else if (node && node.nodeType) {
        // The current non-text node comes after a text node.
        if (hadText && el.nodeName !== 'PRE') {
          hadText = false
          var val = i === 1
            // If the prior text node is the first first of its parent,
            // trim its leading spaces and collapse its trailing spaces.
            ? lastChild.nodeValue
              .replace(leadingSpaceRegex, '')
              .replace(trailingSpaceRegex, ' ')
            // If the prior text node is not the first child of its
            // parent, collapse its leading spaces and collapse its
            // trailing spaces.
            : lastChild.nodeValue
              .replace(leadingSpaceRegex, ' ')
              .replace(trailingSpaceRegex, ' ')
          if (val !== '' && val !== ' ') lastChild.nodeValue = val
          else el.removeChild(lastChild)
        }
        el.appendChild(node)
      }
    }
  }
  appendChild(children)

  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement
